"""Functions embedded in Dify Code nodes by build.py; no platform writes or model calls."""
import copy
import hashlib
import json
import re

SECTIONS = ['duty', 'exp', 'cap', 'pow', 'pot']
DETAILS = {'concise': 6, 'essential': 10, 'regular': 14, 'expanded': 18, 'detailed': 20}
STRUCTURES = ['behavior', 'context_behavior', 'context_behavior_result']
PHASES = {
    'analyze_brief': ['welcome', 'review'], 'confirm_settings': ['review'],
    'prepare_capabilities': ['outline'], 'confirm_sort': ['rank'],
    'generate_draft': ['outline', 'compare'], 'revise_draft': ['scope'],
    'suggest_similar_positions': ['scope'], 'prepare_apply': ['scope'],
}


def dump(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(',', ':'))


def text(value, maximum=3000):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= maximum


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False).encode()).hexdigest()


def component(kind, data):
    return {'type': kind, 'version': '1.0', 'data': data}


def result(ctx, status, reply, components=None, **extra):
    value = dict(schema_version='3.0', action=ctx.get('action', ''), request_id=ctx.get('request_id', ''),
                 session_id=ctx.get('session_id', ''), phase=ctx.get('phase', ''),
                 base_draft_version=ctx.get('draft_version', 0), catalog_version=ctx.get('catalog', {}).get('version', ''),
                 source_standard_id=ctx.get('source_standard',{}).get('id',''),source_standard_version=ctx.get('source_standard',{}).get('version',''),
                 status=status, reply=reply, can_apply=False, components=components or [],
                 service_requests=[], issues=[], draft=None)
    value.update(extra)
    return {'result_json': dump(value)}


def catalog_map(ctx, kind):
    return {item['id']: item for item in ctx['catalog'].get(kind, [])}


def levels_of(item):
    values = [row['level'] for row in item.get('levels', [])]
    require(values and len(values) <= 10 and len(set(values)) == len(values)
            and all(isinstance(v, str) and re.fullmatch(r'L(?:10|[1-9])', v) for v in values), '能力等级须为平台已配置且不重复的L1–L10')
    return values


def generation_key(ctx):
    return fingerprint({key: ctx.get(key) for key in ['session_id', 'operation', 'brief', 'user_message', 'selected_sections',
        'generation_preferences', 'reference_context', 'source_standard']} | {'catalog_version': ctx['catalog']['version']})


def checked_bundle(ctx):
    bundle = ctx.get('capability_bundle', {})
    require(isinstance(bundle, dict) and isinstance(bundle.get('items'), list), '缺少能力候选快照')
    require(bundle.get('context_key') == generation_key(ctx), '生成设置、偏好、词典或来源已变化，请重新生成能力候选')
    items = bundle['items']
    require(bundle.get('token') == fingerprint([bundle['context_key'], items]), '能力候选快照不一致')
    require(0 < len(items) <= DETAILS[ctx['generation_preferences']['detail']], '能力候选数量不符合详略上限')
    require(len({item['id'] for item in items}) == len(items), '能力候选ID重复')
    catalog = catalog_map(ctx, 'cap')
    for item in items:
        require(text(item.get('radar_name'), 80), '缺少雷达图名称')
        require(type(item.get('suggested_score')) is int and 1 <= item['suggested_score'] <= 5, '建议重要性分须为1–5整数')
        if item.get('source') == 'catalog':
            require(item['id'] in catalog and item['name'] == catalog[item['id']]['name'], '已有能力不在本次词典候选中')
            require(item['levels'] == levels_of(catalog[item['id']]), '能力等级配置已变化')
        else:
            require(item.get('source') == 'generated' and item['id'].startswith('proposal-'), '生成能力身份不合法')
            require(item.get('dimension') in ctx['catalog'].get('ability_dimensions', []), '新能力维度不存在')
            require(item.get('category_name') == 'AI 生成', '新能力默认类别须为AI 生成')
            require(item['levels'] == ctx['catalog'].get('new_capability_levels'), '缺少新能力的平台等级配置')
    return items


def sorted_items(ctx, with_ratings=False):
    items = checked_bundle(ctx)
    order = ctx.get('sorted_capability_ids', [])
    require(ctx.get('sort_confirmed') is True and isinstance(order, list)
            and len(order) == len(items) and len(set(order)) == len(order)
            and set(order) == {item['id'] for item in items}, '请确认完整且无重复的能力排序')
    by_id = {item['id']: item for item in items}
    ordered = [by_id[key] for key in order]
    if with_ratings:
        ratings = ctx.get('importance_scores', {})
        require(ctx.get('ratings_confirmed') is True and isinstance(ratings, dict) and set(ratings) == set(order)
                and all(type(score) is int and 1 <= score <= 5 for score in ratings.values()), '请确认每项能力的1–5分重要性评分')
        ordered.sort(key=lambda item: -ratings[item['id']])
    return ordered


def content_errors(ctx, draft):
    require(isinstance(draft, dict) and isinstance(draft.get('content'), dict), '缺少完整标准草稿')
    content = draft['content']
    require(set(content) == set(SECTIONS) and all(isinstance(content[k], list) for k in SECTIONS), '草稿须含五类内容数组')
    require(len(content['cap']) <= 20, '每套标准最多20项能力')
    requirements = draft.get('capability_requirements', [])
    require(len(content['cap']) == len(requirements), '能力要求与等级描述记录不一致')
    ids = [item['id'] for item in requirements]
    require(len(set(ids)) == len(ids), '同一能力不可重复')
    catalog = catalog_map(ctx, 'cap')
    proposed = {item['id']: item for item in ctx.get('capability_bundle', {}).get('items', []) if item.get('source') == 'generated'}
    for index, item in enumerate(requirements):
        source = catalog.get(item['id']) if item['source'] == 'catalog' else proposed.get(item['id'])
        require(source is not None and item['name'] == source['name'], '草稿引用了未知能力或改写词典名称')
        levels = levels_of(source) if item['source'] == 'catalog' else source['levels']
        require(item['required_level'] in levels and text(item.get('radar_name'), 80), '要求等级或雷达图名称不合法')
        require(content['cap'][index] == [item['name'], item['required_level'], item['radar_name']], '编辑器能力数组与身份记录不一致')
        descriptions = item.get('level_descriptions', [])
        require([row.get('level') for row in descriptions] == levels, '须按顺序覆盖能力全部已配置等级，不得遗漏或补造等级')
        structure = ctx['generation_preferences']['description_structure']
        for row in descriptions:
            require(text(row.get('behavior'), 2000), '每个等级必须有行为描述')
            require(structure == 'behavior' or text(row.get('context'), 2000), '所选描述方式需要等级情境')
            require(structure != 'context_behavior_result' or text(row.get('outcome'), 2000), '所选描述方式需要预期成果')
            require(structure != 'behavior' or (not row.get('context') and not row.get('outcome')), '只写行为时不附加情境或成果字段')
            require(structure != 'context_behavior' or not row.get('outcome'), '带上情境时不附加成果字段')
        if item['source'] == 'generated':
            require(text(item.get('definition'), 1000) and item.get('dimension') in ctx['catalog'].get('ability_dimensions', []), '新能力须包含定义和合法维度')
    for duty in content['duty']:
        require(isinstance(duty, dict) and text(duty.get('n'), 200) and isinstance(duty.get('t'), list)
                and all(text(task, 500) for task in duty['t']), '职责任务内容不合法')
    require(all(text(value, 500) for value in content['exp']), '经历经验含空白或超长条目')
    for kind in ['pow', 'pot']:
        names = [item['name'] for item in ctx['catalog'].get(kind, [])]
        require(all(names.count(value) == 1 for value in content[kind]), '动力或潜力须唯一引用已有固定词典')
    return draft


def normalize(action, payload_json):
    ctx = {'action': action}
    try:
        require(isinstance(payload_json, str) and len(payload_json) <= 120000, 'payload_json须为不超过120000字符的JSON文本')
        payload = json.loads(payload_json)
        require(isinstance(payload, dict), 'payload_json须为JSON对象')
        dump(payload)
        ctx.update(payload)
        ctx['action'] = action
        require(action in PHASES and ctx.get('phase') in PHASES[action], '当前阶段不允许执行该动作')
        require(all(text(ctx.get(key), 128) for key in ['request_id', 'session_id']), '缺少请求或会话标识')
        require(type(ctx.get('draft_version', 0)) is int and ctx.get('draft_version', 0) >= 0, '草稿版本不合法')
        enabled, selected = ctx.get('enabled_sections'), ctx.get('selected_sections')
        require(isinstance(enabled, list) and isinstance(selected, list) and bool(selected)
                and all(key in SECTIONS and key in enabled for key in selected)
                and len(set(selected)) == len(selected), '请在启用维度中至少选择一项，不能重复')
        require(ctx.get('operation') in ['new', 'update'], '本次操作须为新建或更新')
        catalog = ctx.get('catalog', {})
        require(isinstance(catalog, dict) and text(catalog.get('version'), 128), '业务服务须提供当前词典版本')
        for kind in ['positions', 'categories', 'cap', 'pow', 'pot']:
            items = catalog.setdefault(kind, [])
            require(isinstance(items, list) and len(items) <= 500 and all(isinstance(item, dict) and text(item.get('id'),128)
                    and text(item.get('name'),120) for item in items), '岗位、类别和指标候选结构不合法')
            require(len({item['id'] for item in items}) == len(items), '候选ID重复')
        for item in catalog['cap']:
            levels_of(item)
        ctx['catalog'] = catalog
        brief = ctx.setdefault('brief', {})
        require(isinstance(brief, dict) and (not brief.get('position_id') or brief['position_id'] in catalog_map(ctx,'positions')), '目标岗位不在当前可用岗位中')
        if ctx['operation'] == 'update':
            source = ctx.get('source_standard', {})
            require(isinstance(source, dict) and text(source.get('id'),128) and text(source.get('version'),128)
                    and isinstance(source.get('content'),dict), '更新须提供原标准及版本')
        refs = ctx.setdefault('reference_context', [])
        require(isinstance(refs,list) and len(refs)<=10 and all(isinstance(item,dict) and text(item.get('id'),128)
                and text(item.get('text'),40000) for item in refs) and sum(len(item['text']) for item in refs)<=40000, '参考资料须为有效文本，最多10份、总计40000字符')
        if action in ['analyze_brief','revise_draft']:
            require(text(ctx.get('user_message'),3000), '请填写本轮需求或修改要求')
        if action not in ['analyze_brief','confirm_settings']:
            require(ctx.get('settings_confirmed') is True and ctx.get('preferences_confirmed') is True, '须先确认生成设置和生成偏好')
            preferences = ctx.get('generation_preferences', {})
            require(preferences.get('detail') in DETAILS, '详略须为简洁、精要、适中、充实、详细五档之一')
            if 'cap' in selected:
                require(preferences.get('description_structure') in STRUCTURES, '能力描述方式不合法')
            else:
                preferences.pop('description_structure', None)
        if action == 'confirm_sort':
            sorted_items(ctx)
        if action == 'prepare_capabilities' and ctx.get('capability_lookup', {}).get('complete') is True:
            require(ctx['capability_lookup'].get('catalog_version') == catalog['version'], '平台检索与当前词典版本不一致，请重新检索')
        if action == 'generate_draft':
            if 'cap' in selected:
                sorted_items(ctx, True)
                require(ctx['phase'] == 'compare', '有能力候选时须完成排序评分后生成')
            else:
                require(ctx['phase'] == 'outline', '无能力维度时由偏好阶段直接生成')
        if action in ['revise_draft','suggest_similar_positions','prepare_apply']:
            require(ctx.get('draft_version',0)>0 and ctx.get('expected_draft_version') == ctx['draft_version'], '草稿已变化，请重新读取最新版本')
            content_errors(ctx, ctx.get('draft'))
        if action == 'suggest_similar_positions':
            require(ctx['operation'] == 'new' and brief.get('position_id'), '更新保留原范围；无目标岗位不能推断相似岗位')
        routes = {'analyze_brief':'analyze','prepare_capabilities':'candidates','generate_draft':'generate',
                  'revise_draft':'revise','suggest_similar_positions':'similar'}
        route = routes.get(action, 'control')
        if action == 'prepare_capabilities' and ('cap' not in selected or ctx.get('capability_lookup',{}).get('complete') is not True):
            route = 'control'
        return {'valid':True,'context_json':dump(ctx),'errors_json':'[]','route':route}
    except (ValueError,TypeError,KeyError) as error:
        return {'valid':False,'context_json':dump(ctx),'errors_json':dump([str(error)]),'route':'control'}


def attach_materials(context_json, texts):
    ctx = json.loads(context_json)
    require(ctx['action']=='analyze_brief', '新增附件后请返回生成设置确认')
    refs=ctx['reference_context']
    for index,value in enumerate(texts):
        require(text(value,40000), '附件未提取到有效文本；扫描件需先OCR')
        key='file:'+fingerprint([ctx['request_id'],index])[:16]
        refs.append({'id':key,'name':'本轮附件'+str(index+1),'text':value})
    require(len(refs)<=10 and sum(len(row['text']) for row in refs)<=40000,'参考资料超过总量限制，请先筛选')
    return {'context_json':dump(ctx)}


def control(ctx):
    action=ctx['action']
    if action=='confirm_settings':
        return result(ctx,'needs_confirmation','请选择生成偏好。',[component('generation_preferences',{
            'detail_options':list(DETAILS),'default_detail':'concise','description_options':STRUCTURES if 'cap' in ctx['selected_sections'] else [],
            'default_description_structure':'behavior' if 'cap' in ctx['selected_sections'] else ''})],next_ui='outline',settings_confirmed=True)
    if action=='prepare_capabilities':
        if 'cap' not in ctx['selected_sections']:
            return result(ctx,'ok','本次未选择能力要求，直接生成标准草稿。',next_ui='outline',next_action='generate_draft')
        return result(ctx,'needs_data','请业务服务先检索当前租户的平台能力词典。',service_requests=[{
            'type':'search_platform_capabilities','request_id':ctx['request_id'],'query':ctx['brief'],
            'user_requirements':ctx.get('user_message',''),'catalog_version':ctx['catalog']['version'],
            'must_search_before_generation':True}],next_action='prepare_capabilities')
    if action=='confirm_sort':
        items=sorted_items(ctx)
        return result(ctx,'needs_confirmation','请核对并调整能力重要性评分。',[component('capability_rating',{
            'items':[{'id':row['id'],'name':row['name'],'suggested_score':row['suggested_score'],'score':row['suggested_score'],'reason':row['reason']} for row in items],
            'min':1,'max':5,'meaning':'岗位重要性，不是要求等级或员工得分'})],next_ui='compare')
    draft=copy.deepcopy(ctx['draft'])
    if ctx['operation']=='update':
        strategy=ctx.get('update_strategy')
        if strategy not in ['replace','merge']:
            return result(ctx,'needs_confirmation','请选择更新方式。',[component('update_strategy',{'options':['replace','merge'],'default':None})],next_ui='scope')
        source=ctx['source_standard']
        merged=copy.deepcopy(source)
        for key in ctx['selected_sections']:
            incoming=draft['content'][key]
            if strategy=='replace':
                merged['content'][key]=copy.deepcopy(incoming)
            else:
                old=merged['content'][key]
                for item in incoming:
                    name=item['n'] if key=='duty' else item[0] if key=='cap' else item
                    index=next((i for i,value in enumerate(old) if (value['n'] if key=='duty' else value[0] if key=='cap' else value)==name),None)
                    if index is None: old.append(copy.deepcopy(item))
                    elif key=='duty': old[index]['t']=list(dict.fromkeys(old[index]['t']+item['t']))
                    elif key=='cap': old[index]=copy.deepcopy(item)
        if 'cap' in ctx['selected_sections']:
            requirements=[] if strategy=='replace' else copy.deepcopy(source.get('capability_requirements',[]))
            incoming_ids={item['id'] for item in draft['capability_requirements']}
            requirements=[item for item in requirements if item['id'] not in incoming_ids]
            requirements.extend(copy.deepcopy(draft['capability_requirements']))
            by_name={item['name']:item for item in requirements}
            merged['capability_requirements']=[by_name[row[0]] for row in merged['content']['cap'] if row[0] in by_name]
            require(len(merged['capability_requirements'])==len(merged['content']['cap']), '原标准缺少能力身份和描述元数据，请业务服务补齐后合并')
        draft=merged
    else:
        choice=ctx.get('scope_choice')
        require(choice in ['position','similar','none'], '请确认应用范围')
        positions=[]
        if choice=='position':
            require(ctx['brief'].get('position_id'),'无目标岗位时请选择暂不关联')
            positions=[ctx['brief']['position_id']]
        elif choice=='similar':
            positions=ctx.get('confirmed_position_ids',[])
            require(isinstance(positions,list) and positions and len(set(positions))==len(positions)
                    and all(key in catalog_map(ctx,'positions') for key in positions),'请明确勾选真实可用岗位，不按类别自动关联')
        draft.update(mode='positions' if positions else 'none',positions=positions,groups=[])
    require(len(draft['content']['cap'])<=20,'更新合并后超过20项能力，请先调整')
    pending=[row for row in draft.get('capability_requirements',[]) if row['source']=='generated']
    confirmed=ctx.get('confirmed_new_capability_ids',[])
    confirmation_token=fingerprint(pending)
    if pending and (ctx.get('new_capabilities_confirmed') is not True or set(confirmed)!={row['id'] for row in pending}
                    or ctx.get('new_capability_confirmation_token')!=confirmation_token):
        return result(ctx,'needs_confirmation','以下新能力确认后将新增到指标库“AI 生成”类别。',
            [component('new_capability_confirmation',{'category_name':'AI 生成','items':pending,'default_confirmed':False,'confirmation_token':confirmation_token})],draft=draft,next_ui='scope')
    creations=[{'proposal_id':row['id'],'name':row['name'],'definition':row['definition'],'dimension':row['dimension'],
                'category_name':'AI 生成','level_descriptions':row['level_descriptions']} for row in pending]
    plan={'type':'save_standard_with_capabilities','standard':draft,'new_capabilities':creations,
          'expected_standard_version':ctx.get('source_standard',{}).get('version',''),'expected_catalog_version':ctx['catalog']['version'],
          'idempotency_key':fingerprint([ctx['session_id'],ctx['draft_version'],draft,creations]),'execute_on':'editor_save',
          'recheck_existing_capabilities':True,'existing_capability_writes':[]}
    return result(ctx,'ok','草稿可带入编辑页；点击编辑页保存后由业务服务保存。',
                  [component('editor_handoff',{'draft':draft,'save_plan':plan})],draft=draft,can_apply=True,next_ui='editor',save_plan=plan)


def brief_result(ctx, model):
    brief=model['brief']
    require(not brief['position_id'] or brief['position_id'] in catalog_map(ctx,'positions'),'模型引用未知岗位')
    require(model['selected_sections'] and all(key in ctx['enabled_sections'] for key in model['selected_sections']),'模型选择未启用维度')
    return result(ctx,'needs_confirmation','请核对生成设置。',[component('generation_settings',{
        'operation':ctx['operation'],'brief':brief,'selected_sections':model['selected_sections'],'enabled_sections':ctx['enabled_sections'],
        'questions':model['questions']})],next_ui='review',brief=brief,selected_sections=model['selected_sections'],reference_context=ctx['reference_context'])


def candidates_result(ctx, model):
    if model['questions']:
        return result(ctx,'needs_clarification','请先核对能力匹配问题。',[component('clarification',{'questions':model['questions']})])
    require(ctx.get('capability_lookup',{}).get('complete') is True,'尚未完成平台能力检索，不能生成新能力')
    catalog=catalog_map(ctx,'cap')
    rows=model['items']
    require(0<len(rows)<=DETAILS[ctx['generation_preferences']['detail']], '能力候选为空或超过详略上限；不能凑数')
    items=[]
    for row in rows:
        existing=catalog.get(row['catalog_id']) if row['catalog_id'] else None
        if row['catalog_id']:
            require(existing is not None,'模型引用了不存在的平台能力ID')
            value=dict(id=existing['id'],name=existing['name'],source='catalog',levels=levels_of(existing),
                       dimension=existing.get('dimension',''),definition=existing.get('definition',''),category_name=existing.get('category_path',''))
        else:
            require(text(row['name'],20) and text(row['definition'],1000) and text(row['unmatched_reason']), '新能力须说明名称、定义和未匹配原因')
            require(not any(item['name'].strip().casefold()==row['name'].strip().casefold() for item in catalog.values()),'已有同名能力，不能绕过复用而生成')
            require(row['dimension'] in ctx['catalog'].get('ability_dimensions',[]),'生成能力的维度不在平台配置中')
            require(all(key in catalog for key in row['considered_ids']),'未匹配说明引用未知能力')
            levels=ctx['catalog'].get('new_capability_levels',[])
            levels_of({'levels':[{'level':value} for value in levels]})
            value=dict(id='proposal-'+fingerprint([ctx['session_id'],row['name']])[:16],name=row['name'].strip(),
                       source='generated',definition=row['definition'],dimension=row['dimension'],category_name='AI 生成',levels=levels,
                       unmatched_reason=row['unmatched_reason'],considered_ids=row['considered_ids'])
        require(text(row['radar_name'],80) and text(row['reason']),'须提供默认雷达图名称和建议依据')
        require(type(row['suggested_score']) is int and 1<=row['suggested_score']<=5,'建议分须为1–5整数')
        value.update(radar_name=row['radar_name'],suggested_score=row['suggested_score'],reason=row['reason'])
        items.append(value)
    require(len({item['id'] for item in items})==len(items) and len({item['name'] for item in items})==len(items),'能力候选重复或同名无法区分')
    key=generation_key(ctx)
    bundle={'context_key':key,'items':items,'token':fingerprint([key,items])}
    return result(ctx,'needs_confirmation','请按岗位重要性排序；新生成能力已单独标明。',
        [component('capability_sort',{'items':items,'interaction':'drag_or_keyboard','show_arrow_buttons':False})],
        capability_bundle=bundle,next_ui='rank')


def draft_result(ctx, model):
    require(not model['questions'],'生成仍有未确认问题：'+'；'.join(model['questions']))
    ordered=sorted_items(ctx,True) if 'cap' in ctx['selected_sections'] else []
    by_id={item['id']:item for item in ordered}
    rows=model['capabilities']
    require(len(rows)==len(ordered) and {row['id'] for row in rows}==set(by_id),'草稿能力与用户已排序评分的候选不一致')
    requirements=[]
    for candidate in ordered:
        row=next(item for item in rows if item['id']==candidate['id'])
        requirements.append(dict(candidate,required_level=row['required_level'],radar_name=row['radar_name'],
                                 importance_score=ctx['importance_scores'][candidate['id']],level_descriptions=row['level_descriptions']))
    content={key:copy.deepcopy(model['content'][key]) if key in ctx['selected_sections'] else [] for key in SECTIONS}
    require(not model['content']['cap'],'模型不得直接写入名称式能力数组，须按确认的ID映射')
    for key in SECTIONS:
        require(key in ctx['selected_sections'] or not model['content'][key],'模型生成未选择的维度')
    content['cap']=[[row['name'],row['required_level'],row['radar_name']] for row in requirements]
    if ctx['operation']=='update':
        draft={key:copy.deepcopy(ctx['source_standard'].get(key)) for key in ['name','category','description','mode','positions','groups','code']}
    else:
        category=catalog_map(ctx,'categories').get(model['category_id'])
        require(category is not None and text(model['name'],80),'草稿名称或类别不合法')
        draft=dict(name=model['name'],category=category['name'],description=model['description'],mode='none',positions=[],groups=[])
    draft.update(content=content,capability_requirements=requirements,
                 generationPreferences={'detail':ctx['generation_preferences']['detail'],**({'descriptionStructure':ctx['generation_preferences']['description_structure']} if ordered else {})})
    content_errors(ctx,draft)
    return result(ctx,'ok','标准草稿已生成，请审阅、修改并确认应用范围。',
        [component('draft_preview',{'draft':draft}),component('update_strategy',{'options':['replace','merge'],'default':None})
         if ctx['operation']=='update' else component('application_scope',{'options':['position','none'] if ctx['brief'].get('position_id') else ['none']})],
        draft=draft,next_ui='scope',proposed_draft_version=ctx.get('draft_version',0)+1)


def similar_result(ctx, model):
    positions=catalog_map(ctx,'positions')
    target=positions[ctx['brief']['position_id']]
    matches=[]
    for row in model['matches']:
        candidate=positions.get(row['position_id'])
        require(candidate is not None and candidate['id']!=target['id'],'相似岗位引用未知或目标自身岗位')
        require(text(row['reason']) and row['evidence'],'候选须有可核对依据')
        for evidence in row['evidence']:
            field=evidence['field']
            require(field in ['duties','tasks','description'],'相似依据不能仅为同类别或名称')
            require(text(evidence['target_quote']) and text(evidence['candidate_quote'])
                    and evidence['target_quote'] in str(target.get(field,'')) and evidence['candidate_quote'] in str(candidate.get(field,'')), '相似依据不在真实岗位资料中')
        matches.append(dict(candidate,reason=row['reason'],evidence=row['evidence']))
    require(len({item['id'] for item in matches})==len(matches),'相似岗位重复')
    return result(ctx,'needs_confirmation' if matches else 'needs_clarification',
        '请核对、调整并确认实际关联岗位。' if matches else '岗位资料不足或无合适候选，请补充资料或人工选择。',
        [component('similar_position_selection',{'candidates':matches,'questions':model['questions'],'requires_explicit_selection':True})],next_ui='scope')


def revision_result(ctx, model):
    if model['questions']:
        return result(ctx,'needs_clarification','请明确本次修改。',[component('clarification',{'questions':model['questions']})])
    targets=model['target_sections']
    require(targets and all(key in ctx['selected_sections'] for key in targets),'只能修改本次所选维度')
    draft=copy.deepcopy(ctx['draft'])
    before=copy.deepcopy(draft)
    for key in SECTIONS:
        if key in targets: draft['content'][key]=model['content'][key]
        else: require(not model['content'][key],'模型越界修改其他维度')
    if 'cap' in targets:
        previous={item['id']:item for item in before['capability_requirements']}
        for item in model['capability_requirements']:
            require(item['id'] in previous,'新增能力须返回平台检索和候选确认流程')
            require(all(item.get(key)==previous[item['id']].get(key) for key in ['name','source','levels','importance_score']), '局部修改不能改变能力身份、评分或等级配置')
        draft['capability_requirements']=model['capability_requirements']
    else:
        require(not model['capability_requirements'],'修改其他维度不能改能力描述')
    content_errors(ctx,draft)
    require(draft!=before,'本轮未产生实际修改，请明确修改目标')
    return result(ctx,'ok','已更新指定分项，其他内容保留。',[component('draft_preview',{'draft':draft})],
                  draft=draft,next_ui='scope',proposed_draft_version=ctx['draft_version']+1)
