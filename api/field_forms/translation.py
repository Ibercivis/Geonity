ISO_3166_1_ALPHA2 = {
    'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT',
    'AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW',
    'BV','BR','IO','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL',
    'CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ',
    'DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ',
    'FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP',
    'GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID',
    'IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR',
    'KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY',
    'MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS',
    'MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MK',
    'MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR',
    'QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST',
    'SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES',
    'LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO',
    'TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU',
    'VE','VN','VG','VI','WF','EH','YE','ZM','ZW',
}


def get_language_from_request(request):
    """Extract primary language code from Accept-Language header. e.g. 'es-ES,es;q=0.9,en' → 'es'"""
    if not request:
        return 'en'
    accept = request.META.get('HTTP_ACCEPT_LANGUAGE', 'en')
    lang = accept.split(',')[0].split('-')[0].strip().lower()
    return lang or 'en'


def resolve_translation(value, lang, fallback='en'):
    """Return the translated string for a given language, with fallback to 'default', then 'en', then first available."""
    import json as _json

    def _resolve(d):
        return d.get(lang) or d.get('default') or d.get(fallback) or next(iter(d.values()), '')

    if not value:
        return ''
    if isinstance(value, str):
        try:
            parsed = _json.loads(value)
            if isinstance(parsed, dict):
                return _resolve(parsed)
        except (ValueError, TypeError):
            pass
        return value  # plain string (legacy data)
    if isinstance(value, dict):
        return _resolve(value)
    return str(value)
