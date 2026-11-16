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
             'string': isinstance(value, str), 'integer': type(value) is int, 'number': isinstance(value, (int, float)) and not isinstance(value, bool)}
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
    elif kind in ['number', 'integer']:
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
