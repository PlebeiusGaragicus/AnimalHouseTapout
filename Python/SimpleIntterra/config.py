CONFIG = {
    'URL_LOGIN': 'https://apps.intterragroup.com',
    'URL_INCIDENT_ENDPOINT': 'https://dc.intterragroup.com/v1/sitstat/data/incidents'
}

cookies = {
    'access_token': None,
    'refresh_token': None,
    'agstoken': None,
}



# my_unit = "E3"
# _my_unit = None
_my_unit = "E3"

unit_status_map = {}

def my_unit():
    return _my_unit

def set_my_unit(unit):
    global _my_unit
    _my_unit = unit
