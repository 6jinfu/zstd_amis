"""1127 workflow contracts, executed offline with explicit model substitutes."""
import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from talent_standard_workflow_harness import DSL, NODES, EDGES, ROOT, run_graph
spec = importlib.util.spec_from_file_location('examples', ROOT / 'dify/talent-standard-ai-assistant-v3/examples.py')
ex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ex)
rt = ex.runtime


class WorkflowContracts(unittest.TestCase):
    def run_action(self, action, payload, **kwargs):
        return run_graph(action, copy.deepcopy(payload), **kwargs)

    def candidate_result(self, model=None):
        p = ex.payload(True)
        p['capability_lookup'] = {'complete': True, 'catalog_version': 'demo-v1'}
        return self.run_action('prepare_capabilities', p, models={'candidates_llm': model or ex.candidate_model()})[0]

    def invalid_before_model(self, action, payload):
        value, visited = self.run_action(action, payload)
        self.assertEqual(value['status'], 'invalid')
        self.assertFalse(any(NODES[key]['type'] == 'llm' for key in visited))

    def test_graph_and_matching_exports(self):
        self.assertEqual(DSL['kind'], 'app')
        self.assertEqual(DSL['app']['mode'], 'workflow')
        self.assertEqual(DSL['dependencies'], [])
        self.assertEqual((ROOT/'dify/talent-standard-ai-assistant-workflow.yml').read_bytes(), (ROOT/'dify/talent-standard-ai-assistant-workflow-import-fix.yml').read_bytes())
        seen=set()
        def visit(key, active):
            self.assertNotIn(key, active, 'cycle')
            if key in seen: return
            for edge in EDGES:
                if edge['source']==key:
                    self.assertIn(edge['target'], NODES)
                    visit(edge['target'],active|{key})
            seen.add(key)
        visit('start',set())
        self.assertEqual(seen,set(NODES))
        llms=[node for node in NODES.values() if node['type']=='llm']
        self.assertEqual(len(llms),5)
        self.assertTrue(all(node['model']['name']=='qwen3.6-plus' for node in llms))
        for node in NODES.values():
            if node['type']=='code': compile(node['code'],'dsl-code','exec')

    def test_analyze_and_attached_material_context(self):
        p=ex.payload();p['phase']='welcome'
        model={'brief':p['brief'],'selected_sections':['duty','exp'],'questions':[]}
        value,visited=self.run_action('analyze_brief',p,models={'brief_llm':model},files=[{'type':'document'}],extracted=['参考岗位职责原文'])
        self.assertIn('materials',visited)
        self.assertEqual(value['components'][0]['type'],'generation_settings')
        self.assertEqual(value['reference_context'][-1]['text'],'参考岗位职责原文')
        self.assertFalse(value['can_apply'])

    def test_lookup_must_complete_before_model(self):
        value,visited=self.run_action('prepare_capabilities',ex.payload(True))
        self.assertEqual(value['status'],'needs_data')
        self.assertEqual(value['service_requests'][0]['type'],'search_platform_capabilities')
        self.assertNotIn('candidates_llm',visited)
        p=ex.payload(True);p['capability_lookup']={'complete':True,'catalog_version':'old'}
        self.invalid_before_model('prepare_capabilities',p)

    def test_reuse_and_new_proposal_are_distinguished(self):
        result=self.candidate_result()
        old,new=result['capability_bundle']['items']
        self.assertEqual((old['id'],old['name'],old['levels']),('cap1','团队管理',['L1','L3','L10']))
        self.assertEqual(new['category_name'],'AI 生成')
        self.assertEqual(new['levels'],['L1','L2','L3'])
        self.assertTrue(new['id'].startswith('proposal-'))
        self.assertFalse(result['components'][0]['data']['show_arrow_buttons'])
        self.assertEqual(result['service_requests'],[])

    def test_reject_forged_candidates(self):
        for key,value in [('catalog_id','missing'),('name','团队管理'),('dimension','missing'),('considered_ids',['missing'])]:
            with self.subTest(key=key):
                model=ex.candidate_model();model['items'][1][key]=value
                result=self.candidate_result(model)
                self.assertEqual(result['status'],'invalid')
                self.assertIsNone(result['draft'])

    def test_settings_and_rating_gates(self):
        for key,value in [('settings_confirmed',False),('preferences_confirmed',False),('sort_confirmed',False),('ratings_confirmed',False),('importance_scores',{'cap1':0})]:
            with self.subTest(key=key):
                p=ex.prepared();p[key]=value
                self.invalid_before_model('generate_draft',p)
        p=ex.prepared();p['sorted_capability_ids']=['cap1','cap1']
        self.invalid_before_model('generate_draft',p)

    def test_stale_candidate_bundle(self):
        for key,value in [('user_message','改变了建模场景'),('generation_preferences',{'detail':'detailed','description_structure':'behavior'})]:
            p=ex.prepared();p[key]=value
            self.invalid_before_model('generate_draft',p)
        p=ex.prepared();p['catalog']['version']='new-version'
        self.invalid_before_model('generate_draft',p)

    def test_rating_defaults_and_stable_ties(self):
        p=ex.prepared();p['phase']='rank';p['sorted_capability_ids'].reverse()
        result,_=self.run_action('confirm_sort',p)
        self.assertEqual([x['score'] for x in result['components'][0]['data']['items']],[3,4])
        p['phase']='compare'
        result,_=self.run_action('generate_draft',p,models={'draft_llm':ex.draft_model(p)})
        self.assertEqual([x['id'] for x in result['draft']['capability_requirements']],p['sorted_capability_ids'])

    def test_without_capability_skips_ranking(self):
        p=ex.payload()
        result,_=self.run_action('generate_draft',p,models={'draft_llm':ex.draft_model(p)})
        self.assertEqual(result['status'],'ok')
        self.assertEqual(result['draft']['capability_requirements'],[])
        self.assertEqual(result['draft']['content']['cap'],[])
        scope=next(item for item in result['components'] if item['type']=='application_scope')
        self.assertEqual(scope['data']['options'],['position','none'])

    def test_draft_actual_levels_and_missing_level_rejected(self):
        p=ex.prepared();model=ex.draft_model(p)
        result,_=self.run_action('generate_draft',p,models={'draft_llm':model})
        self.assertEqual(result['status'],'ok')
        self.assertEqual([x['level'] for x in result['draft']['capability_requirements'][0]['level_descriptions']],['L1','L3','L10'])
        model['capabilities'][0]['level_descriptions'].pop()
        result,_=self.run_action('generate_draft',p,models={'draft_llm':model})
        self.assertEqual(result['status'],'invalid')

    def test_description_modes_and_new_identity_rejected(self):
        p=ex.prepared();model=ex.draft_model(p)
        model['capabilities'][0]['level_descriptions'][0]['outcome']=''
        result,_=self.run_action('generate_draft',p,models={'draft_llm':model})
        self.assertEqual(result['status'],'invalid')
        model=ex.draft_model(p);model['capabilities'][0]['id']='unknown'
        result,_=self.run_action('generate_draft',p,models={'draft_llm':model})
        self.assertEqual(result['status'],'invalid')

    def test_new_library_items_require_explicit_snapshot_confirmation(self):
        p=ex.scoped()
        pending,_=self.run_action('prepare_apply',p)
        self.assertEqual(pending['status'],'needs_confirmation')
        self.assertFalse(pending['can_apply'])
        self.assertNotIn('save_plan',pending)
        p.update(new_capabilities_confirmed=True,confirmed_new_capability_ids=[x['id'] for x in p['draft']['capability_requirements'] if x['source']=='generated'],new_capability_confirmation_token=pending['components'][0]['data']['confirmation_token'])
        ready,_=self.run_action('prepare_apply',p)
        self.assertTrue(ready['can_apply'])
        self.assertEqual(ready['save_plan']['execute_on'],'editor_save')
        self.assertEqual(ready['save_plan']['existing_capability_writes'],[])
        self.assertEqual(ready['save_plan']['new_capabilities'][0]['category_name'],'AI 生成')
        p['draft']['capability_requirements'][1]['level_descriptions'][0]['behavior']='修改后的新能力行为'
        stale,_=self.run_action('prepare_apply',p)
        self.assertEqual(stale['status'],'needs_confirmation')

    def test_merge_replaces_same_ability_descriptions_preserves_others(self):
        p=ex.scoped(False)
        source=copy.deepcopy(p['draft']);source.update(id='std1',version='7',name='原名称',mode='positions',positions=['p3'])
        other=copy.deepcopy(p['catalog']['cap'][0]);other.update(id='cap2',name='其他能力')
        p['catalog']['cap'].append(other)
        source['content']['duty']=[{'n':'原职责','t':['原任务']}]
        source['content']['cap'].append(['其他能力','L1','其他组'])
        old=copy.deepcopy(source['capability_requirements'][0]);old.update(id='cap2',name='其他能力',required_level='L1',radar_name='其他组')
        source['capability_requirements'].append(old)
        source['capability_requirements'][0]['level_descriptions'][0]['behavior']='原描述'
        p.update(operation='update',source_standard=source,update_strategy='merge')
        value,_=self.run_action('prepare_apply',p)
        self.assertEqual(value['status'],'ok')
        draft=value['draft']
        self.assertEqual(draft['name'],'原名称');self.assertEqual(draft['positions'],['p3'])
        self.assertIn(['其他能力','L1','其他组'],draft['content']['cap'])
        self.assertEqual(draft['capability_requirements'][1],old)
        self.assertNotEqual(draft['capability_requirements'][0]['level_descriptions'][0]['behavior'],'原描述')
        self.assertIn({'n':'原职责','t':['原任务']},draft['content']['duty'])

    def test_similar_positions_require_real_evidence_and_no_category_selection(self):
        p=ex.scoped(False)
        model={'matches':[{'position_id':'p2','reason':'实际交付职责相近','evidence':[{'field':'duties','target_quote':'组织跨团队项目交付','candidate_quote':'组织跨团队项目交付并验收'}]}],'questions':[]}
        value,_=self.run_action('suggest_similar_positions',p,models={'similar_llm':model})
        data=value['components'][0]['data']
        self.assertEqual([x['id'] for x in data['candidates']],['p2'])
        self.assertTrue(data['requires_explicit_selection'])
        model['matches'][0]['evidence'][0]['candidate_quote']='虚构职责'
        value,_=self.run_action('suggest_similar_positions',p,models={'similar_llm':model})
        self.assertEqual(value['status'],'invalid')
        value,_=self.run_action('suggest_similar_positions',p,models={'similar_llm':{'matches':[],'questions':['缺少可比较资料']}})
        self.assertEqual(value['status'],'needs_clarification')

    def test_revision_preserves_manual_edits_and_version_gate(self):
        p=ex.scoped(False);p['user_message']='只调整职责'
        p['draft']['content']['exp']=['用户手工修改的经验']
        model={'target_sections':['duty'],'content':{x:[] for x in ['duty','exp','cap','pow','pot']},'capability_requirements':[],'questions':[]}
        model['content']['duty']=[{'n':'新职责','t':['新任务']}]
        value,_=self.run_action('revise_draft',p,models={'revision_llm':model})
        self.assertEqual(value['draft']['content']['exp'],['用户手工修改的经验'])
        self.assertEqual(value['draft']['positions'],p['draft']['positions'])
        self.assertEqual(value['proposed_draft_version'],2)
        p['expected_draft_version']=0
        self.invalid_before_model('revise_draft',p)

    def test_request_examples_normalize(self):
        files=list((ROOT/'dify/talent-standard-ai-assistant-v3/requests').glob('*.request.json'))
        self.assertEqual(len(files),10)
        for path in files:
            body=json.loads(path.read_text())['inputs']
            with self.subTest(file=path.name):
                value=rt.normalize(body['action'],body['payload_json'])
                self.assertTrue(value['valid'],value['errors_json'])


if __name__=='__main__': unittest.main()
