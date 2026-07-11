import {NextResponse} from 'next/server'

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const{id}=await params
  return NextResponse.json({
    id,
    type:'citizen-dashboard',
    panelPath:'/vatandas/panel',
    apiPath:`/api/vatandas/${id}`,
    auth:'Bu vatandas API kaydi, kullanicinin kayit olup kendi bilgileriyle giris yaptigi panele aittir.',
    fields:['profile','projects','votes','district','verification'],
    message:'Demo ortaminda vatandas profil ve basvuru verileri tarayici localStorage alaninda tutulur. Uretimde bu endpoint veritabanindaki kullanici, proje ve oy kayitlariyla doldurulabilir.',
  })
}
