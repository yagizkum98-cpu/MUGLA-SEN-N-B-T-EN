export const muglaDistrictDashboards=[
  {name:'Bodrum',slug:'bodrum',apiPath:'/api/dashboard/bodrum',panelPath:'/dashboard/bodrum',accessCode:'BODRUM-2026'},
  {name:'Dalaman',slug:'dalaman',apiPath:'/api/dashboard/dalaman',panelPath:'/dashboard/dalaman',accessCode:'DALAMAN-2026'},
  {name:'Datca',slug:'datca',apiPath:'/api/dashboard/datca',panelPath:'/dashboard/datca',accessCode:'DATCA-2026'},
  {name:'Fethiye',slug:'fethiye',apiPath:'/api/dashboard/fethiye',panelPath:'/dashboard/fethiye',accessCode:'FETHIYE-2026'},
  {name:'Kavaklidere',slug:'kavaklidere',apiPath:'/api/dashboard/kavaklidere',panelPath:'/dashboard/kavaklidere',accessCode:'KAVAKLIDERE-2026'},
  {name:'Koycegiz',slug:'koycegiz',apiPath:'/api/dashboard/koycegiz',panelPath:'/dashboard/koycegiz',accessCode:'KOYCEGIZ-2026'},
  {name:'Marmaris',slug:'marmaris',apiPath:'/api/dashboard/marmaris',panelPath:'/dashboard/marmaris',accessCode:'MARMARIS-2026'},
  {name:'Mentese',slug:'mentese',apiPath:'/api/dashboard/mentese',panelPath:'/dashboard/mentese',accessCode:'MENTESE-2026'},
  {name:'Milas',slug:'milas',apiPath:'/api/dashboard/milas',panelPath:'/dashboard/milas',accessCode:'MILAS-2026'},
  {name:'Ortaca',slug:'ortaca',apiPath:'/api/dashboard/ortaca',panelPath:'/dashboard/ortaca',accessCode:'ORTACA-2026'},
  {name:'Seydikemer',slug:'seydikemer',apiPath:'/api/dashboard/seydikemer',panelPath:'/dashboard/seydikemer',accessCode:'SEYDIKEMER-2026'},
  {name:'Ula',slug:'ula',apiPath:'/api/dashboard/ula',panelPath:'/dashboard/ula',accessCode:'ULA-2026'},
  {name:'Yatagan',slug:'yatagan',apiPath:'/api/dashboard/yatagan',panelPath:'/dashboard/yatagan',accessCode:'YATAGAN-2026'},
] as const

export type MuglaDistrictDashboard=typeof muglaDistrictDashboards[number]

export function findDistrictDashboard(slug:string){
  return muglaDistrictDashboards.find(district=>district.slug===slug)
}
