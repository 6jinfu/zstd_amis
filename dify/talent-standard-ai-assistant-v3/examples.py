"""Complete API request examples and model substitutes used by offline tests."""
import copy
import importlib.util
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('workflow_runtime', HERE/'runtime.py')
runtime=importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


def payload(cap=False):
    return {'request_id':'r-1127','session_id':'s-1127','operation':'new','phase':'outline','draft_version':0,
        'user_message':'为跨团队项目交付制定人才标准','brief':{'position_id':'p1','scenario':'跨团队交付'},
        'enabled_sections':['duty','exp','cap','pow','pot'],'selected_sections':['duty','exp','cap'] if cap else ['duty','exp'],
        'settings_confirmed':True,'preferences_confirmed':True,
        'generation_preferences':{'detail':'concise',**({'description_structure':'context_behavior_result'} if cap else {})},
        'reference_context':[], 'catalog':{'version':'demo-v1',
            'positions':[{'id':'p1','name':'技术负责人','category_path':'研发','duties':'组织跨团队项目交付'},
                         {'id':'p2','name':'项目交付负责人','category_path':'运营','duties':'组织跨团队项目交付并验收'},
                         {'id':'p3','name':'设备维护员','category_path':'研发','duties':'开展设备维护与巡检'}],
            'categories':[{'id':'general','name':'通用标准'}],
            'cap':[{'id':'cap1','name':'团队管理','definition':'组织团队协作完成任务','dimension':'技能','category_path':'技能.管理能力',
                    'levels':[{'level':'L1','description':'在指导下完成任务'},{'level':'L3','description':'独立协调团队任务'},{'level':'L10','description':'组织复杂业务协同'}]}],
            'pow':[{'id':'pow1','name':'成就导向'}],'pot':[{'id':'pot1','name':'学习敏锐'}],
            'ability_dimensions':['技能','素养','知识'],'new_capability_levels':['L1','L2','L3']}}


def candidate_model(new=True):
    rows=[{'catalog_id':'cap1','name':'','definition':'','dimension':'','radar_name':'交付协作','suggested_score':4,
           'reason':'岗位涉及组织团队交付，建议优先关注','unmatched_reason':'','considered_ids':[]}]
    if new:
        rows.append({'catalog_id':'','name':'跨系统交付治理','definition':'协调跨系统交付约束并组织验收的能力','dimension':'技能',
                     'radar_name':'交付协作','suggested_score':3,'reason':'作为当前场景的补充建议',
                     'unmatched_reason':'检索的团队管理不覆盖跨系统验收约束','considered_ids':['cap1']})
    return {'items':rows,'questions':[]}


def prepared(new=True):
    value=payload(True)
    value['capability_lookup']={'complete':True,'request_id':'lookup-1','query':'跨团队交付','catalog_version':'demo-v1'}
    normalized=runtime.normalize('prepare_capabilities',json.dumps(value))
    ctx=json.loads(normalized['context_json'])
    result=json.loads(runtime.candidates_result(ctx,candidate_model(new))['result_json'])
    value.update(phase='compare',capability_bundle=result['capability_bundle'],sort_confirmed=True,ratings_confirmed=True)
    value['sorted_capability_ids']=[row['id'] for row in value['capability_bundle']['items']]
    value['importance_scores']={row['id']:4 for row in value['capability_bundle']['items']}
    return value


def draft_model(value):
    return {'name':'项目交付标准','category_id':'general','description':'面向跨团队项目交付的标准建议',
        'content':{'duty':[{'n':'组织项目交付','t':['对齐验收要求']}],'exp':['具有项目协作实践经验'],'cap':[],'pow':[],'pot':[]},
        'capabilities':[{'id':row['id'],'required_level':row['levels'][-1],'radar_name':row['radar_name'],
            'level_descriptions':[{'level':level,'behavior':'按本等级职责组织任务与反馈','context':'项目交付时','outcome':'形成可核对的阶段交付物'} for level in row['levels']]} for row in value.get('capability_bundle',{}).get('items',[])],
        'questions':[]}


def scoped(new=True):
    value=prepared(new)
    ctx=json.loads(runtime.normalize('generate_draft',json.dumps(value))['context_json'])
    draft=json.loads(runtime.draft_result(ctx,draft_model(value))['result_json'])['draft']
    value.update(phase='scope',draft_version=1,expected_draft_version=1,draft=draft,scope_choice='position')
    return value


def write_examples():
    directory=HERE/'requests'
    directory.mkdir(exist_ok=True)
    initial=payload();initial.update(phase='welcome');initial.pop('settings_confirmed');initial.pop('preferences_confirmed')
    settings=copy.deepcopy(initial);settings['phase']='review'
    lookup=payload(True)
    candidates=payload(True);candidates['capability_lookup']={'complete':True,'request_id':'lookup-1','catalog_version':'demo-v1'}
    rank=prepared();rank['phase']='rank'
    apply=scoped()
    pending=json.loads(runtime.control({**apply,'action':'prepare_apply'})['result_json'])
    confirmed=copy.deepcopy(apply)
    confirmed.update(new_capabilities_confirmed=True,confirmed_new_capability_ids=[row['id'] for row in apply['draft']['capability_requirements'] if row['source']=='generated'],
                     new_capability_confirmation_token=pending['components'][0]['data']['confirmation_token'])
    similar=scoped(False)
    update=scoped(False);source=copy.deepcopy(update['draft']);source.update(id='std-existing',version='v7')
    update.update(operation='update',source_standard=source,update_strategy='merge')
    records=[('01-analyze','analyze_brief',initial),('02-confirm-settings','confirm_settings',settings),
             ('03-request-platform-lookup','prepare_capabilities',lookup),('04-match-or-generate','prepare_capabilities',candidates),
             ('05-confirm-sort','confirm_sort',rank),('06-generate-draft','generate_draft',prepared()),
             ('07-similar-positions','suggest_similar_positions',similar),('08-confirm-new-capabilities','prepare_apply',apply),
             ('09-editor-handoff','prepare_apply',confirmed),('10-merge-update','prepare_apply',update)]
    for name,action,value in records:
        body={'inputs':{'action':action,'payload_json':json.dumps(value,ensure_ascii=False),'reference_files':[]},'response_mode':'streaming','user':'example-user'}
        (directory/(name+'.request.json')).write_text(json.dumps(body,ensure_ascii=False,indent=2))
    print(f'{len(records)} request examples; all data is synthetic')


if __name__=='__main__':
    write_examples()
