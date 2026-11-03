import {useState} from 'react';
import type {MapGeoJson} from '@cloudflare/kumo';
import world from '../../../shared/assets/world-110m.geo.json';
import {VisitTrafficPanel} from '../../../shared/components/visit-analytics/VisitTrafficPanel';
import {VisitGeographyPanel} from '../../../shared/components/visit-analytics/VisitGeographyPanel';
/** No collection endpoint is connected yet. Never substitute preview samples for real traffic. */
export function HomeVisitAnalytics(){
 const [mode,setMode]=useState('requests');
 return <VisitTrafficPanel nodes={[]} links={[]} rows={[]} stages={['访问来源','客户端','访问页面','访问身份']} mode={mode} onModeChange={setMode} onNodeClick={()=>{}} onReset={()=>{}} total={0}
 geography={<VisitGeographyPanel geoJson={world as MapGeoJson} regions={[]} onSelect={()=>{}} onReset={()=>{}}/>}/>;
}
