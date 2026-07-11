'use client'
import {MapContainer,TileLayer,Marker,Popup} from 'react-leaflet'
import L from 'leaflet'
import type{ProjectRecord}from '@/lib/projects-store'
import 'leaflet/dist/leaflet.css'

const icon=L.divIcon({className:'map-dot',iconSize:[28,28],iconAnchor:[14,28]})
export default function ProjectMap({projects}:{projects:ProjectRecord[]}){return <MapContainer center={[37.08,28.45]} zoom={8} scrollWheelZoom className="h-full min-h-[520px]"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{projects.map(p=><Marker key={p.id} position={[p.lat,p.lng]} icon={icon}><Popup><strong>{p.title}</strong><br/>{p.district} · {p.votes} destek</Popup></Marker>)}</MapContainer>}
