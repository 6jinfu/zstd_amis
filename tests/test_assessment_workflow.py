"""Execute the delivered assessment DSL offline, substituting fixed model outputs."""
import copy
import json
from pathlib import Path
import re
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]
DSL = yaml.safe_load((ROOT / 'dify/assessment-ai-assistant-workflow.yml').read_text())
NODES = {n['id']: n['data'] for n in DSL['workflow']['graph']['nodes']}
EDGES = DSL['workflow']['graph']['edges']
EXAMPLES = ROOT / 'dify/assessment-ai-assistant-examples'


def example(name):
    value = json.loads((EXAMPLES / (name + '.input.json')).read_text())
    return value['action'], json.loads(value['payload_json'])


def execute(node_id, **kwargs):
    namespace = {}
    exec(compile(NODES[node_id]['code'], node_id, 'exec'), namespace)
    result = namespace['main'](**kwargs)
    assert set(result) == set(NODES[node_id]['outputs']), node_id
    for key, value in result.items():
        kind = NODES[node_id]['outputs'][key]['type']
        expected = {'string': str, 'boolean': bool, 'array[object]': list, 'array[string]': list}[kind]
        assert isinstance(value, expected), (node_id, key)
        if kind.startswith('array'):
            item_type = str if kind == 'array[string]' else dict
            assert all(isinstance(x, item_type) for x in value), (node_id, key)
    return result


def schema_check(value, schema):
    kind = schema['type']
    expected = {'object': dict, 'array': list, 'string': str, 'integer': int, 'boolean': bool}
    assert isinstance(value, expected[kind]), (kind, value)
    if kind == 'integer':
        assert type(value) is int
        assert schema.get('minimum', value) <= value <= schema.get('maximum', value)
    if 'enum' in schema:
        assert value in schema['enum']
    if kind == 'object':
        assert set(schema['required']) <= set(value)
        if schema.get('additionalProperties') is False:
            assert set(value) <= set(schema['properties'])
        for key in value:
            schema_check(value[key], schema['properties'][key])
    elif kind == 'array':
        assert schema.get('minItems', 0) <= len(value) <= schema.get('maxItems', 100000)
        for item in value:
            schema_check(item, schema['items'])
    elif kind == 'string':
        assert schema.get('minLength', 0) <= len(value) <= schema.get('maxLength', 100000)


def fake_questions(job):
    questions = []
    for kind, count in job['counts'].items():
        for index in range(count):
            questions.append({'type': kind, 'text': f'在{job["scenario"]}中，如何观察{job["ability"]}的{kind}行为{index + 1}？',
                              'options': ['行为表现一', '行为表现二', '缺少观察，无法判断'] if kind in ['single', 'multi'] else [],
                              'behavior': f'{job["ability"]}的{kind}行为{index + 1}'})
    return {'questions': questions}


def graph_run(action, payload, question_model=fake_questions, adjustment_model=None):
    values = {'start': {'action': action, 'payload_json': json.dumps(payload, ensure_ascii=False)}}
    queue, visited = ['start'], []

    def read(selector):
        current = values[selector[0]]
        for key in selector[1:]:
            current = current[key]
        return current

    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        data, handle = NODES[node_id], 'source'
        if data['type'] == 'code':
            values[node_id] = execute(node_id, **{v['variable']: read(v['value_selector']) for v in data['variables']})
        elif data['type'] == 'if-else':
            handle = 'false'
            for case in data['cases']:
                if all(read(c['variable_selector']) == c['value'] for c in case['conditions']):
                    handle = case['case_id']
                    break
        elif data['type'] == 'iteration':
            outputs = []
            for index, job in enumerate(read(data['iterator_selector'])):
                values[node_id] = {'item': job, 'index': index}
                subqueue = [data['start_node_id']]
                while subqueue:
                    sub_id = subqueue.pop(0)
                    child = NODES[sub_id]
                    if child['type'] == 'llm':
                        response = question_model(job)
                        schema_check(response, child['structured_output']['schema'])
                        values[sub_id] = {'structured_output': response}
                    elif child['type'] == 'code':
                        values[sub_id] = execute(sub_id, **{v['variable']: read(v['value_selector']) for v in child['variables']})
                    visited.append(sub_id)
                    subqueue.extend(e['target'] for e in EDGES if e['source'] == sub_id)
                outputs.append(read(data['output_selector']))
            values[node_id] = {'output': outputs}
        elif data['type'] == 'llm':
            assert adjustment_model is not None, 'Unexpected model call'
            schema_check(adjustment_model, data['structured_output']['schema'])
            values[node_id] = {'structured_output': copy.deepcopy(adjustment_model)}
        elif data['type'] == 'variable-aggregator':
            values[node_id] = {}
            for group in data['advanced_settings']['groups']:
                choices = [read(v) for v in group['variables'] if v[0] in values]
                assert choices
                values[node_id][group['group_name']] = {'output': choices[0]}
        elif data['type'] == 'end':
            result = {v['variable']: read(v['value_selector']) for v in data['outputs']}
            return json.loads(result['result_json']), result['question_batches'], visited + [node_id]
        visited.append(node_id)
        queue.extend(e['target'] for e in EDGES if e['source'] == node_id and e['sourceHandle'] == handle)
    raise AssertionError('No Output reached')


def ready_adjustment(**changes):
    value = {'status': 'ready', 'has_scenario_change': False, 'scenario': '',
             'counts_changes': {'single': -1, 'multi': -1, 'score': -1, 'essay': -1}, 'questions': []}
    value['counts_changes'].update(changes)
    return value


class AssessmentWorkflowTests(unittest.TestCase):
    def normalize(self, action, payload):
        return execute('normalize', action=action, payload_json=json.dumps(payload, ensure_ascii=False))

    def test_dsl_models_iteration_and_selectors(self):
        self.assertEqual(DSL['dependencies'], [])
        self.assertEqual(DSL['version'], '0.4.0')
        self.assertEqual(DSL['app']['mode'], 'workflow')
        parent = next(n for n in DSL['workflow']['graph']['nodes'] if n['id'] == 'per_ability')
        self.assertEqual(parent['data']['start_node_id'], 'ability_start')
        self.assertFalse(parent['data']['is_parallel'])
        self.assertEqual(parent['data']['error_handle_mode'], 'terminated')
        self.assertEqual(parent['data']['output_selector'], ['validate_ability', 'batch_json'])
        node_ids = set(NODES)
        parents = {key: set() for key in NODES}
        for edge in EDGES:
            self.assertIn(edge['source'], node_ids)
            self.assertIn(edge['target'], node_ids)
            parents[edge['target']].add(edge['source'])
            source = NODES[edge['source']]
            handles = {c['case_id'] for c in source.get('cases', [])} | {'false'} if source['type'] == 'if-else' else {'source'}
            self.assertIn(edge['sourceHandle'], handles)
        parents['ability_start'].add('per_ability')
        ancestry = {}

        def ancestors(key, stack=()):
            self.assertNotIn(key, stack, 'Cycle')
            if key not in ancestry:
                ancestry[key] = parents[key] | set().union(*(ancestors(p, stack + (key,)) for p in parents[key]))
            return ancestry[key]

        for key, data in NODES.items():
            self.assertTrue(key == 'start' or 'start' in ancestors(key))
            selectors = []
            if data['type'] == 'code':
                compile(data['code'], key, 'exec')
                selectors.extend(v['value_selector'] for v in data['variables'])
            elif data['type'] == 'llm':
                self.assertEqual(data['model']['name'], 'qwen3.6-plus')
                self.assertEqual(data['model']['provider'], 'langgenius/tongyi/tongyi')
                self.assertTrue(data['structured_output_enabled'])
                self.assertFalse(data['retry_config']['retry_enabled'])
                for prompt in data['prompt_template']:
                    selectors.extend([list(m) for m in re.findall(r'\{\{#([^.#]+)\.([^#]+)#\}\}', prompt['text'])])
            elif data['type'] == 'variable-aggregator':
                for group in data['advanced_settings']['groups']:
                    selectors.extend(group['variables'])
            elif data['type'] == 'if-else':
                selectors.extend(c['variable_selector'] for case in data['cases'] for c in case['conditions'])
            elif data['type'] == 'end':
                selectors.extend(v['value_selector'] for v in data['outputs'])
            elif data['type'] == 'iteration':
                selectors.append(data['iterator_selector'])
            for selector in selectors:
                self.assertIn(selector[0], ancestors(key), (key, selector))
                source = NODES[selector[0]]
                outputs = set(source['outputs']) if source['type'] == 'code' else {'structured_output'} if source['type'] == 'llm' else {'item', 'index', 'output'} if source['type'] == 'iteration' else {'result', 'questions'} if source['type'] == 'variable-aggregator' else {v['variable'] for v in source.get('variables', [])}
                self.assertIn(selector[1], outputs, (key, selector))

    def test_default_studio_input_generates_eight_questions(self):
        variables = NODES['start']['variables']
        action = next(v['default'] for v in variables if v['variable'] == 'action')
        payload = json.loads(next(v['default'] for v in variables if v['variable'] == 'payload_json'))
        result, batches, visited = graph_run(action, payload)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['question_count'], 8)
        self.assertEqual(len(batches), 2)
        self.assertEqual(visited.count('question_llm'), 2)
        questions = [q for batch in batches for q in json.loads(batch)['questions']]
        self.assertEqual(set(questions[0]), {'id', 'ability', 'type', 'text', 'options'})
        self.assertEqual(result['editor_path'], 'assess-new.html?ai=1')
        self.assertEqual(result['editor_base']['counts'], payload['counts'])

    def test_prepare_returns_checkboxes_without_model(self):
        action, payload = example('01-prepare-standard')
        result, batches, visited = graph_run(action, payload)
        self.assertEqual(result['status'], 'needs_confirmation')
        self.assertEqual(result['ui']['type'], 'assessment_confirmation')
        self.assertEqual(len(result['ui']['abilities']), 3)
        self.assertTrue(all(x['checked'] for x in result['ui']['abilities']))
        self.assertTrue(result['ui']['supplement_optional'])
        self.assertEqual(batches, [])
        self.assertNotIn('question_llm', visited)

    def test_optional_scenario_and_default_counts_do_not_add_questions(self):
        action, payload = example('01-prepare-standard')
        for key in ['purpose', 'scenario', 'counts']:
            payload.pop(key, None)
        result, _, _ = graph_run(action, payload)
        self.assertEqual(result['review']['counts'], {'single': 3, 'multi': 1, 'score': 1, 'essay': 1})
        self.assertEqual(result['status'], 'needs_confirmation')

    def test_multiple_position_standards_require_a_click_selection(self):
        action, payload = example('03-select-one-standard')
        result, _, visited = graph_run(action, payload)
        self.assertEqual(result['status'], 'needs_selection')
        self.assertEqual(len(result['ui']['options']), 2)
        self.assertNotIn('question_llm', visited)
        payload['entry']['standard_id'] = 'std-management'
        result, _, _ = graph_run(action, payload)
        self.assertEqual(result['review']['standardId'], 'std-management')

    def test_position_scope_never_expands_to_other_standard_positions(self):
        action, payload = example('02-prepare-position')
        payload['positions'].append({'id': 'RD-205', 'name': '后端开发工程师', 'standard_ids': ['std-architecture']})
        payload['standards'][0]['positions'].append('RD-205')
        result, _, _ = graph_run(action, payload)
        self.assertEqual(result['review']['scope']['positions'], ['RD-302'])
        payload['entry'] = {'type': 'standard', 'standard_id': 'std-architecture'}
        result, _, _ = graph_run(action, payload)
        self.assertEqual(result['review']['scope']['positions'], ['RD-302', 'RD-205'])

    def test_rule_scope_keeps_and_or_without_employee_data(self):
        action, payload = example('07-prepare-rules')
        result, _, _ = graph_run(action, payload)
        self.assertEqual(result['review']['scope']['groups'], payload['standards'][0]['groups'])
        self.assertEqual(result['review']['scope']['mode'], 'rules')
        self.assertEqual(result['status'], 'needs_confirmation')

    def test_invalid_source_or_unlinked_position_stops_before_model(self):
        action, base = example('02-prepare-position')
        for mutation in ['no-cap', 'no-link', 'bad-level']:
            payload = copy.deepcopy(base)
            if mutation == 'no-cap':
                payload['standards'][0]['content']['cap'] = []
            elif mutation == 'no-link':
                payload['standards'][0]['positions'] = []
                payload['positions'][0]['standard_ids'] = []
            else:
                payload['standards'][0]['content']['cap'][0][1] = 'L9'
            result, _, visited = graph_run(action, payload)
            self.assertEqual(result['status'], 'invalid')
            self.assertNotIn('question_llm', visited)

    def test_unselected_ability_cannot_be_generated(self):
        action, payload = example('04-generate-questionnaire')
        payload['selected_abilities'] = ['系统架构']
        result, batches, _ = graph_run(action, payload)
        self.assertEqual(result['question_count'], 4)
        self.assertEqual({q['ability'] for b in batches for q in json.loads(b)['questions']}, {'系统架构'})
        payload['selected_abilities'] = ['虚构能力']
        result, batches, visited = graph_run(action, payload)
        self.assertEqual(result['status'], 'invalid')
        self.assertFalse(batches)
        self.assertNotIn('question_llm', visited)

    def test_confirmation_and_source_version_gates_precede_model(self):
        action, base = example('04-generate-questionnaire')
        for field, value, status in [('confirmed', False, 'invalid'), ('expected_standard_version', 'old', 'stale_source')]:
            payload = copy.deepcopy(base)
            payload[field] = value
            result, batches, visited = graph_run(action, payload)
            self.assertEqual(result['status'], status)
            self.assertFalse(batches)
            self.assertNotIn('question_llm', visited)

    def test_empty_and_invalid_counts_or_selection_are_rejected(self):
        action, base = example('04-generate-questionnaire')
        for value in [{'single': 0, 'multi': 0, 'score': 0, 'essay': 0}, {'single': True, 'multi': 1, 'score': 1, 'essay': 1}, {'single': 6, 'multi': 1, 'score': 1, 'essay': 1}]:
            payload = copy.deepcopy(base)
            payload['counts'] = value
            result, _, visited = graph_run(action, payload)
            self.assertEqual(result['status'], 'invalid')
            self.assertNotIn('question_llm', visited)
        base['selected_abilities'] = []
        result, _, _ = graph_run(action, base)
        self.assertEqual(result['status'], 'invalid')

    def test_each_ability_has_exact_per_type_counts(self):
        action, payload = example('04-generate-questionnaire')
        payload['counts'] = {'single': 3, 'multi': 1, 'score': 2, 'essay': 0}
        result, batches, _ = graph_run(action, payload)
        self.assertEqual(result['question_count'], 12)
        for batch in batches:
            rows = json.loads(batch)['questions']
            self.assertEqual({kind: sum(q['type'] == kind for q in rows) for kind in payload['counts']}, payload['counts'])

    def test_maximum_supported_question_count_uses_twenty_bounded_batches(self):
        action, payload = example('04-generate-questionnaire')
        payload['standards'][0]['content']['cap'] = [[f'测试能力{i}', 'L3'] for i in range(20)]
        payload['selected_abilities'] = [f'测试能力{i}' for i in range(20)]
        payload['counts'] = {kind: 5 for kind in ['single', 'multi', 'score', 'essay']}
        result, batches, visited = graph_run(action, payload)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['question_count'], 400)
        self.assertEqual(len(batches), 20)
        self.assertEqual(visited.count('question_llm'), 20)
        self.assertTrue(all(len(raw) < 70000 for raw in batches))

    def test_question_ids_are_deterministic_and_unique(self):
        action, payload = example('04-generate-questionnaire')
        first = graph_run(action, payload)[1]
        second = graph_run(action, payload)[1]
        self.assertEqual(first, second)
        ids = [q['id'] for raw in first for q in json.loads(raw)['questions']]
        self.assertEqual(len(ids), len(set(ids)))

    def test_invalid_question_bundle_never_creates_partial_questionnaire(self):
        action, payload = example('04-generate-questionnaire')
        def missing_question(job):
            value = fake_questions(job)
            value['questions'].pop()
            return value
        result, batches, _ = graph_run(action, payload, question_model=missing_question)
        self.assertEqual(result['status'], 'invalid')
        self.assertFalse(result['can_create'])
        self.assertEqual(batches, [])

    def test_choice_options_and_duplicate_question_text_are_validated(self):
        action, payload = example('04-generate-questionnaire')
        normalized = self.normalize(action, payload)
        job = normalized['jobs'][0]
        for mutation in ['duplicate-options', 'score-options', 'duplicate-text']:
            model = fake_questions(job)
            if mutation == 'duplicate-options':
                model['questions'][0]['options'] = ['相同', '相同']
            elif mutation == 'score-options':
                next(q for q in model['questions'] if q['type'] == 'score')['options'] = ['1', '2']
            else:
                model['questions'][1]['text'] = model['questions'][0]['text']
            result = json.loads(execute('validate_ability', job=job, model=model)['batch_json'])
            self.assertFalse(result['valid'])
            self.assertEqual(result['questions'], [])

    def test_level_definition_is_used_only_when_supplied(self):
        action, payload = example('04-generate-questionnaire')
        payload['ability_definitions'] = [{'name': '系统架构', 'description': '架构方案设计能力', 'levels': [{'level': 'L4', 'description': '建立跨团队架构协作机制'}]}]
        result, batches, _ = graph_run(action, payload)
        self.assertEqual(result['status'], 'ok')
        first, second = [json.loads(b)['question_metadata'] for b in batches]
        self.assertEqual(first[0]['level_basis'], 'provided_definition')
        self.assertEqual(second[0]['level_basis'], 'standard_level_only')

    def test_adjustment_keeps_untouched_settings_and_requires_replace_only_for_existing(self):
        action, payload = example('05-adjust-on-request')
        model = ready_adjustment(single=2)
        result, batches, visited = graph_run(action, payload, adjustment_model=model)
        self.assertEqual(result['status'], 'replacement_required')
        self.assertEqual(result['review']['counts']['single'], 2)
        self.assertEqual(result['review']['counts']['score'], 1)
        self.assertEqual(result['review']['selectedAbilities'], payload['selected_abilities'])
        self.assertFalse(batches)
        self.assertNotIn('question_llm', visited)
        payload.update(phase='review', questionnaire_version=0)
        result, _, _ = graph_run(action, payload, adjustment_model=model)
        self.assertEqual(result['status'], 'ok')
        self.assertFalse(result['requires_replace_confirmation'])

    def test_ambiguous_adjustment_only_clarifies_without_regeneration(self):
        action, payload = example('05-adjust-on-request')
        model = ready_adjustment()
        model.update(status='needs_clarification', questions=['请说明要调整场景还是题数。'])
        result, batches, visited = graph_run(action, payload, adjustment_model=model)
        self.assertEqual(result['status'], 'needs_clarification')
        self.assertFalse(batches)
        self.assertNotIn('question_llm', visited)

    def test_unresolved_adjustment_questions_do_not_apply_partial_changes(self):
        action, payload = example('05-adjust-on-request')
        model = ready_adjustment(single=2)
        model['questions'] = ['尚不清楚具体场景，请补充。']
        result, batches, _ = graph_run(action, payload, adjustment_model=model)
        self.assertEqual(result['status'], 'needs_clarification')
        self.assertNotIn('review', result)
        self.assertFalse(batches)

    def test_regeneration_needs_explicit_replace_and_current_version(self):
        action, base = example('06-regenerate-confirmed')
        result, batches, _ = graph_run(action, base)
        self.assertEqual(result['question_count'], 6)
        self.assertEqual(result['proposed_questionnaire_version'], 2)
        for field, value, status in [('replace_confirmed', False, 'replacement_required'), ('expected_questionnaire_version', 0, 'stale_questionnaire')]:
            payload = copy.deepcopy(base)
            payload[field] = value
            result, batches, visited = graph_run(action, payload)
            self.assertEqual(result['status'], status)
            self.assertFalse(batches)
            self.assertNotIn('question_llm', visited)

    def test_nonfinite_and_oversized_payload_are_safe(self):
        for raw in ['{}', '[]', '{"x":NaN}', '{"x":1e999}', 'x'*60001]:
            result = execute('normalize', action='prepare_assessment', payload_json=raw)
            self.assertEqual(result['route'], 'return')
            self.assertEqual(json.loads(result['result_json'])['status'], 'invalid')

    def test_all_test_input_files_are_well_formed(self):
        paths = sorted(EXAMPLES.glob('*.input.json'))
        self.assertEqual(len(paths), 7)
        for path in paths:
            data = json.loads(path.read_text())
            normalized = execute('normalize', action=data['action'], payload_json=data['payload_json'])
            result = json.loads(normalized['result_json'])
            self.assertNotEqual(result['status'], 'invalid', path.name)

    def test_model_failure_cannot_be_hidden_by_partial_iteration_results(self):
        action, payload = example('04-generate-questionnaire')
        def broken(job):
            raise RuntimeError('Simulated provider failure')
        with self.assertRaisesRegex(RuntimeError, 'provider failure'):
            graph_run(action, payload, question_model=broken)


if __name__ == '__main__':
    unittest.main()
