"""Offline contract and graph regression checks; no Dify or model API calls."""
import copy
import json
from pathlib import Path
import re
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]
DSL = yaml.safe_load((ROOT / 'dify/talent-standard-ai-assistant-workflow.yml').read_text())
NODES = {node['id']: node['data'] for node in DSL['workflow']['graph']['nodes']}
EDGES = DSL['workflow']['graph']['edges']
SECTIONS = ['duty', 'exp', 'cap', 'pow', 'pot']


def execute_code(node_id, **kwargs):
    namespace = {}
    exec(compile(NODES[node_id]['code'], node_id, 'exec'), namespace)
    result = namespace['main'](**kwargs)
    if set(result) != set(NODES[node_id]['outputs']):
        raise AssertionError(node_id + ': output keys differ from declared outputs')
    types = {'string': str, 'boolean': bool, 'object': dict, 'number': (int, float)}
    for key, value in result.items():
        if not isinstance(value, types[NODES[node_id]['outputs'][key]['type']]):
            raise AssertionError(node_id + ': wrong output type for ' + key)
    return result


def validate_schema(value, schema):
    """Validate the JSON Schema subset used in this self-contained DSL."""
    kind = schema['type']
    valid = {'object': isinstance(value, dict), 'array': isinstance(value, list),
             'string': isinstance(value, str), 'number': isinstance(value, (int, float)) and not isinstance(value, bool)}
    assert valid[kind], (kind, value)
    if 'enum' in schema:
        assert value in schema['enum'], value
    if kind == 'object':
        assert set(schema.get('required', [])) <= set(value)
        if schema.get('additionalProperties') is False:
            assert set(value) <= set(schema['properties'])
        for key, child in value.items():
            validate_schema(child, schema['properties'][key])
    elif kind == 'array':
        assert schema.get('minItems', 0) <= len(value) <= schema.get('maxItems', 100000)
        for item in value:
            validate_schema(item, schema['items'])
    elif kind == 'number':
        assert schema.get('minimum', float('-inf')) <= value <= schema.get('maximum', float('inf'))


def run_graph(action, payload, models=None, files=None, extracted=None):
    """Follow actual DSL branch handles with model/extractor outputs substituted."""
    values = {'start': {'action': action, 'payload_json': json.dumps(payload, ensure_ascii=False), 'reference_files': files or []}}
    queue = ['start']
    visited = []
    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        data = NODES[node_id]
        kind = data['type']
        handle = 'source'

        def read(selector):
            return values[selector[0]][selector[1]]

        if kind == 'code':
            values[node_id] = execute_code(node_id, **{v['variable']: read(v['value_selector']) for v in data['variables']})
        elif kind == 'if-else':
            handle = 'false'
            for case in data['cases']:
                outcomes = []
                for condition in case['conditions']:
                    actual = read(condition['variable_selector'])
                    outcomes.append(bool(actual) if condition['comparison_operator'] == 'not empty' else actual == condition['value'])
                if all(outcomes):
                    handle = case['case_id']
                    break
        elif kind == 'llm':
            model = copy.deepcopy((models or {})[node_id])
            validate_schema(model, data['structured_output']['schema'])
            values[node_id] = {'structured_output': model}
        elif kind == 'document-extractor':
            values[node_id] = {'text': extracted or []}
        elif kind == 'variable-aggregator':
            choices = [read(v) for v in data['variables'] if v[0] in values]
            assert choices, node_id
            values[node_id] = {'output': choices[0]}
        elif kind == 'end':
            output = {v['variable']: read(v['value_selector']) for v in data['outputs']}
            return json.loads(output['result_json']), visited + [node_id]
        visited.append(node_id)
        queue.extend(e['target'] for e in EDGES if e['source'] == node_id and e['sourceHandle'] == handle)
    raise AssertionError('Graph did not reach an Output node')


def note(section, name, **extra):
    result = {'section': section, 'item': name, 'basis': 'inference', 'source_ids': ['confirmed_brief'], 'quote': '', 'confidence': 0.9}
    result.update(extra)
    return result


def payload():
    return {'request_id': 'r1', 'session_id': 's1', 'phase': 'welcome', 'operation': 'new',
            'draft_version': 0, 'user_message': '为企业软件销售岗位建立通用标准',
            'enabled_sections': SECTIONS, 'selected_sections': ['duty', 'exp'], 'brief': {},
            'catalog': {'positions': [], 'categories': [{'id': 'general', 'name': '通用标准'}], 'cap': [], 'pow': [], 'pot': []},
            'reference_context': []}


def confirmed():
    result = payload()
    result.update(phase='outline', brief_confirmed=True, focus_confirmed=True,
                  brief={'scenario': '企业软件销售业务', 'position_id': '', 'level': '未指定', 'management': '未指定'},
                  detail='concise', focus='balanced')
    return result


def work():
    return {'name': '销售通用标准', 'category_id': 'general', 'description': '面向企业软件销售业务。',
            'work_summary': '理解需求，形成方案并推动交付。',
            'duty': [{'n': '推动客户方案交付', 't': ['确认需求与交付目标']}], 'exp': ['具有相关项目实践经历'],
            'questions': [], 'evidence_notes': [note('duty', '推动客户方案交付'), note('exp', '具有相关项目实践经历')]}


def indicators():
    return {'cap': [], 'pow': [], 'pot': [], 'unmatched_suggestions': [], 'questions': [], 'evidence_notes': []}


def revision_payload():
    result = confirmed()
    result.update(phase='scope', draft_version=3, expected_draft_version=3,
                  user_message='将职责任务中的交付目标改为验收标准，其他内容不要动',
                  draft={'name': '用户自改名称', 'category': '通用标准', 'description': '用户手工修改的说明',
                         'mode': 'none', 'positions': [], 'groups': [],
                         'content': {'duty': copy.deepcopy(work()['duty']), 'exp': ['用户手工编辑的经历'], 'cap': [], 'pow': [], 'pot': []}},
                  draft_evidence_notes=[note('exp', '用户手工编辑的经历')])
    return result


def plan():
    return {'status': 'ready', 'target_sections': ['duty'], 'instruction': '将交付目标改为验收标准，保留其他条目', 'questions': []}


def revision():
    return {'content': {'duty': [{'n': '推动客户方案交付', 't': ['确认需求与验收标准']}], 'exp': [], 'cap': [], 'pow': [], 'pot': []},
            'questions': [], 'evidence_notes': [note('duty', '推动客户方案交付')]}


class WorkflowTests(unittest.TestCase):
    def context(self, action, value):
        result = execute_code('normalize', action=action, payload_json=json.dumps(value, ensure_ascii=False))
        self.assertTrue(result['valid'], result['errors_json'])
        return result['context_json']

    def test_import_does_not_request_a_pinned_plugin_package(self):
        self.assertEqual(DSL['dependencies'], [])
        self.assertEqual(DSL['version'], '0.4.0')
        download = ROOT / 'dify/talent-standard-ai-assistant-workflow-import-fix.yml'
        self.assertEqual(yaml.safe_load(download.read_text()), DSL)

    def test_dsl_topology_selectors_and_models(self):
        self.assertEqual(DSL['app']['mode'], 'workflow')
        self.assertEqual(DSL['version'], '0.4.0')
        self.assertEqual(len(NODES), len(DSL['workflow']['graph']['nodes']))
        parents = {key: set() for key in NODES}
        for edge in EDGES:
            self.assertIn(edge['source'], NODES)
            self.assertIn(edge['target'], NODES)
            parents[edge['target']].add(edge['source'])
            self.assertEqual(edge['data']['sourceType'], NODES[edge['source']]['type'])
            source = NODES[edge['source']]
            handles = {c['case_id'] for c in source.get('cases', [])} | {'false'} if source['type'] == 'if-else' else {'source'}
            self.assertIn(edge['sourceHandle'], handles)
        ancestry = {}

        def ancestors(key, stack=()):
            self.assertNotIn(key, stack, 'Cycle in workflow')
            if key not in ancestry:
                ancestry[key] = parents[key] | set().union(*(ancestors(p, stack + (key,)) for p in parents[key]))
            return ancestry[key]

        for key, node in NODES.items():
            self.assertTrue(key == 'start' or 'start' in ancestors(key), key)
            refs = []
            if node['type'] == 'code':
                compile(node['code'], key, 'exec')
                refs += [v['value_selector'] for v in node['variables']]
            elif node['type'] == 'variable-aggregator':
                refs += node['variables']
            elif node['type'] == 'end':
                refs += [v['value_selector'] for v in node['outputs']]
            elif node['type'] == 'if-else':
                refs += [c['variable_selector'] for case in node['cases'] for c in case['conditions']]
            elif node['type'] == 'document-extractor':
                refs.append(node['variable_selector'])
            elif node['type'] == 'llm':
                self.assertEqual(node['model']['name'], 'qwen3.6-plus')
                self.assertEqual(node['model']['provider'], 'langgenius/tongyi/tongyi')
                self.assertTrue(node['structured_output_enabled'])
                self.assertFalse(node['retry_config']['retry_enabled'])
                for prompt in node['prompt_template']:
                    refs += [list(m) for m in re.findall(r'\{\{#([^.#]+)\.([^#]+)#\}\}', prompt['text'])]
            for selector in refs:
                self.assertIn(selector[0], ancestors(key), (key, selector))
                source = NODES[selector[0]]
                outputs = set(source.get('outputs', {})) if source['type'] == 'code' else {'structured_output'} if source['type'] == 'llm' else {'output'} if source['type'] == 'variable-aggregator' else {'text'} if source['type'] == 'document-extractor' else {v['variable'] for v in source.get('variables', [])}
                self.assertIn(selector[1], outputs, (key, selector))

    def test_default_import_example_runs_to_modeling_card(self):
        value = json.loads(next(v['default'] for v in NODES['start']['variables'] if v['variable'] == 'payload_json'))
        model = {'brief': {'scenario': value['user_message'], 'position_id': '', 'level': '基层/初级', 'management': '不带团队'},
                 'selected_sections': ['duty', 'exp'], 'position_confidence': 0, 'conflicts': [], 'questions': [], 'evidence_notes': []}
        result, _ = run_graph('analyze_brief', value, {'brief_llm': model})
        self.assertEqual(result['next_ui'], 'review')
        self.assertEqual(result['status'], 'needs_confirmation')
        self.assertIsNone(result['draft'])

    def test_all_confirmation_and_phase_gates_precede_models(self):
        for field, replacement in [('brief_confirmed', False), ('focus_confirmed', False), ('phase', 'review'), ('phase', 'welcome'), ('phase', 'scope')]:
            with self.subTest(field=field, value=replacement):
                value = confirmed()
                value[field] = replacement
                result, visited = run_graph('generate_draft', value)
                self.assertEqual(result['status'], 'invalid')
                self.assertFalse(any(NODES[n]['type'] == 'llm' for n in visited))

    def test_disabled_or_empty_dimensions_are_rejected(self):
        for selected in [[], ['cap'], ['duty', 'duty'], [{}]]:
            value = payload()
            value['enabled_sections'] = ['duty']
            value['selected_sections'] = selected
            result, _ = run_graph('analyze_brief', value)
            self.assertEqual(result['status'], 'invalid')

    def test_nonfinite_and_oversized_payloads_return_invalid(self):
        for raw in ['{"x":NaN}', '{"x":1e999}', 'x' * 60001, '[]', '{']:
            value = execute_code('normalize', action='analyze_brief', payload_json=raw)
            self.assertFalse(value['valid'])

    def test_duty_only_generation_skips_indicator_model(self):
        result, visited = run_graph('generate_draft', confirmed(), {'work_llm': work()})
        self.assertEqual(result['status'], 'ok')
        self.assertNotIn('indicators_llm', visited)
        self.assertEqual(result['draft']['mode'], 'none')
        self.assertTrue(result['can_apply'])
        self.assertEqual(result['next_ui'], 'scope')

    def test_generation_preserves_reference_evidence(self):
        value = confirmed()
        value['reference_context'] = [{'id': 'doc1', 'name': '岗位说明书', 'text': '工作要求：确认需求与交付目标。'}]
        model = work()
        model['evidence_notes'][0] = note('duty', '推动客户方案交付', basis='reference', source_ids=['doc1'], quote='确认需求与交付目标')
        result, _ = run_graph('generate_draft', value, {'work_llm': model})
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['evidence_notes'][0]['source_ids'], ['doc1'])

    def test_complete_indicator_branch_resolves_ids_to_editor_names(self):
        value = confirmed()
        value['selected_sections'] = SECTIONS
        value['catalog'].update(cap=[{'id': 'cap-1', 'name': '团队管理', 'levels': [{'level': 'L2', 'description': '协调明确任务'}]}],
                                pow=[{'id': 'pow-1', 'name': '成就导向'}], pot=[{'id': 'pot-1', 'name': '学习敏锐'}])
        terms = indicators()
        terms.update(cap=[{'id': 'cap-1', 'level': 'L2'}], pow=[{'id': 'pow-1'}], pot=[{'id': 'pot-1'}],
                     evidence_notes=[note('cap', '团队管理'), note('pow', '成就导向'), note('pot', '学习敏锐')])
        result, visited = run_graph('generate_draft', value, {'work_llm': work(), 'indicators_llm': terms})
        self.assertIn('indicators_llm', visited)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['draft']['content']['cap'], [['团队管理', 'L2']])
        self.assertEqual(result['draft']['content']['pow'], ['成就导向'])
        self.assertEqual(result['draft']['content']['pot'], ['学习敏锐'])

    def test_low_confidence_is_not_an_applicable_success(self):
        model = work()
        model['evidence_notes'][0]['confidence'] = 0.4
        result, _ = run_graph('generate_draft', confirmed(), {'work_llm': model})
        self.assertEqual(result['status'], 'needs_confirmation')
        self.assertFalse(result['can_apply'])
        self.assertTrue(result['questions'])

    def test_missing_candidate_returns_question_instead_of_inventing_indicator(self):
        value = confirmed()
        value['selected_sections'] = ['pow']
        value['catalog']['pow'] = [{'id': 'pow-1', 'name': '成就导向'}]
        model = work()
        model.update(duty=[], exp=[], evidence_notes=[])
        terms = indicators()
        terms['unmatched_suggestions'] = [{'section': 'pow', 'suggestion': '技术钻研', 'reason': '提供的候选中未找到匹配项'}]
        result, _ = run_graph('generate_draft', value, {'work_llm': model, 'indicators_llm': terms})
        self.assertEqual(result['status'], 'needs_confirmation')
        self.assertEqual(result['draft']['content']['pow'], [])
        self.assertFalse(result['can_apply'])

    def test_all_delivered_request_examples_pass_input_validation(self):
        examples = ROOT / 'dify/talent-standard-ai-assistant-examples'
        paths = sorted(examples.glob('*.request.json'))
        self.assertEqual(len(paths), 4)
        for path in paths:
            with self.subTest(path=path.name):
                body = json.loads(path.read_text())
                self.assertEqual(body['response_mode'], 'streaming')
                result = execute_code('normalize', action=body['inputs']['action'], payload_json=body['inputs']['payload_json'])
                self.assertTrue(result['valid'], result['errors_json'])

    def test_fabricated_reference_quote_or_source_is_rejected(self):
        for changes in [{'source_ids': ['missing'], 'quote': '不存在'}, {'source_ids': ['doc1'], 'quote': '不存在'}]:
            value = confirmed()
            value['reference_context'] = [{'id': 'doc1', 'name': '材料', 'text': '确认需求与交付目标'}]
            model = work()
            model['evidence_notes'][0] = note('duty', '推动客户方案交付', basis='reference', **changes)
            result, _ = run_graph('generate_draft', value, {'work_llm': model})
            self.assertEqual(result['status'], 'invalid')
            self.assertIsNone(result['draft'])

    def test_new_attachment_returns_reusable_context(self):
        model = {'brief': {'scenario': '企业软件销售', 'position_id': '', 'level': '未指定', 'management': '未指定'},
                 'selected_sections': ['duty', 'exp'], 'position_confidence': 0, 'conflicts': [], 'questions': [], 'evidence_notes': []}
        result, visited = run_graph('analyze_brief', payload(), {'brief_llm': model}, files=['file-object'], extracted=['确认需求与交付目标'])
        self.assertIn('extract', visited)
        self.assertEqual(result['reference_context'][0]['text'], '确认需求与交付目标')

    def test_no_attachment_skips_extractor(self):
        result, visited = run_graph('generate_draft', confirmed(), {'work_llm': work()})
        self.assertNotIn('extract', visited)
        self.assertEqual(result['status'], 'ok')

    def test_new_attachment_cannot_skip_confirmation(self):
        with self.assertRaisesRegex(ValueError, '返回建模信息确认'):
            run_graph('generate_draft', confirmed(), {}, files=['file-object'], extracted=['新资料'])

    def test_empty_extraction_stops_before_model(self):
        with self.assertRaisesRegex(ValueError, '未提取到有效文本'):
            run_graph('analyze_brief', payload(), {}, files=['file-object'], extracted=[''])

    def test_invalid_level_is_not_coerced_to_l3(self):
        value = confirmed()
        value['selected_sections'] = ['cap']
        value['catalog']['cap'] = [{'id': 'cap-1', 'name': '团队管理', 'levels': [{'level': 'L2', 'description': '协调明确任务'}]}]
        ctx = self.context('generate_draft', value)
        model = work()
        model.update(duty=[], exp=[], evidence_notes=[])
        terms = indicators()
        terms.update(cap=[{'id': 'cap-1', 'level': 'L9'}], evidence_notes=[note('cap', '团队管理')])
        result = json.loads(execute_code('generate_result', context_json=ctx, work=model, indicators=terms)['result_json'])
        self.assertEqual(result['status'], 'invalid')
        self.assertIsNone(result['draft'])

    def test_unknown_indicator_id_cannot_be_persisted(self):
        value = confirmed()
        value['selected_sections'] = ['pow']
        value['catalog']['pow'] = [{'id': 'pow-1', 'name': '成就导向'}]
        model = work()
        model.update(duty=[], exp=[], evidence_notes=[])
        terms = indicators()
        terms['pow'] = [{'id': 'invented'}]
        result, _ = run_graph('generate_draft', value, {'work_llm': model, 'indicators_llm': terms})
        self.assertEqual(result['status'], 'invalid')

    def test_ambiguous_revision_does_not_call_rewriter(self):
        model = {'status': 'needs_clarification', 'target_sections': [], 'instruction': '', 'questions': ['请说明要调整哪个分项，以及调整方向。']}
        result, visited = run_graph('revise_draft', revision_payload(), {'plan_llm': model})
        self.assertEqual(result['status'], 'needs_clarification')
        self.assertNotIn('revision_llm', visited)
        self.assertIsNone(result['draft'])

    def test_local_revision_preserves_manual_edits_and_metadata(self):
        value = revision_payload()
        result, _ = run_graph('revise_draft', value, {'plan_llm': plan(), 'revision_llm': revision()})
        self.assertEqual(result['status'], 'ok')
        for field in ['name', 'category', 'description', 'mode', 'positions', 'groups']:
            self.assertEqual(result['draft'][field], value['draft'][field])
        self.assertEqual(result['draft']['content']['exp'], ['用户手工编辑的经历'])
        self.assertEqual(result['evidence_notes'][0]['item'], '用户手工编辑的经历')
        self.assertEqual(result['change_summary'], [{'section': 'duty', 'before': 1, 'after': 1, 'added': 0, 'removed': 0, 'modified': 1}])
        self.assertEqual(result['base_draft_version'], 3)
        self.assertEqual(result['proposed_draft_version'], 4)

    def test_revision_of_unselected_dimension_requires_clarification(self):
        model = plan()
        model['target_sections'] = ['cap']
        result, visited = run_graph('revise_draft', revision_payload(), {'plan_llm': model})
        self.assertEqual(result['status'], 'needs_clarification')
        self.assertNotIn('revision_llm', visited)

    def test_rewriter_cannot_replace_other_dimensions(self):
        model = revision()
        model['content']['exp'] = ['模型越界修改经历']
        model['evidence_notes'].append(note('exp', '模型越界修改经历'))
        result, _ = run_graph('revise_draft', revision_payload(), {'plan_llm': plan(), 'revision_llm': model})
        self.assertEqual(result['status'], 'invalid')
        self.assertFalse(result['can_apply'])

    def test_noop_revision_never_claims_success(self):
        model = revision()
        model['content']['duty'] = work()['duty']
        result, _ = run_graph('revise_draft', revision_payload(), {'plan_llm': plan(), 'revision_llm': model})
        self.assertEqual(result['status'], 'needs_clarification')
        self.assertIsNone(result['draft'])

    def test_mismatched_revision_version_stops_before_models(self):
        value = revision_payload()
        value['expected_draft_version'] = 2
        result, visited = run_graph('revise_draft', value)
        self.assertEqual(result['status'], 'invalid')
        self.assertNotIn('plan_llm', visited)

    def test_update_candidate_keeps_original_metadata_without_merging(self):
        value = confirmed()
        value['operation'] = 'update'
        value['source_standard'] = copy.deepcopy(revision_payload()['draft'])
        value['source_standard'].update(id='std-old', version='v7')
        result, _ = run_graph('generate_draft', value, {'work_llm': work()})
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['draft']['name'], '用户自改名称')
        self.assertEqual(result['source_standard_version'], 'v7')
        self.assertNotEqual(result['draft']['content']['exp'], value['source_standard']['content']['exp'])

    def test_model_failure_propagates_without_a_fake_draft(self):
        with self.assertRaises(KeyError):
            run_graph('generate_draft', confirmed(), {})


if __name__ == '__main__':
    unittest.main()
