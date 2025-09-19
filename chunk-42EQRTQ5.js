import{a as k}from"./chunk-NXOYKD4N.js";import{a as m}from"./chunk-GOBT7UBB.js";import{a as h}from"./chunk-WFXXN3GR.js";import{ba as d,g as c,ga as p}from"./chunk-B6672ACT.js";import{a as o,b as u,g as f,i as s}from"./chunk-ODN5LVDJ.js";var i=f(k());var L=(()=>{class n{constructor(t,e){this.supabase=t,this.directAuthService=e,this.mapInstance=null,this.markersLayer=null,this.markersSubject=new c([]),this.markers$=this.markersSubject.asObservable(),this.currentPositionSubject=new c(null),this.currentPosition$=this.currentPositionSubject.asObservable(),this.isLoadingSubject=new c(!1),this.isLoading$=this.isLoadingSubject.asObservable(),this.customIcons={frente:{activo:i.divIcon({className:"custom-marker frente-activo",html:'<div class="marker-pin"><i class="material-icons">construction</i></div>',iconSize:[30,42],iconAnchor:[15,42]}),inactivo:i.divIcon({className:"custom-marker frente-inactivo",html:'<div class="marker-pin"><i class="material-icons">pause_circle</i></div>',iconSize:[30,42],iconAnchor:[15,42]}),completado:i.divIcon({className:"custom-marker frente-completado",html:'<div class="marker-pin"><i class="material-icons">check_circle</i></div>',iconSize:[30,42],iconAnchor:[15,42]})},actividad:{activo:i.divIcon({className:"custom-marker actividad-activo",html:'<div class="marker-pin"><i class="material-icons">assignment</i></div>',iconSize:[25,35],iconAnchor:[12,35]}),alerta:i.divIcon({className:"custom-marker actividad-alerta",html:'<div class="marker-pin"><i class="material-icons">warning</i></div>',iconSize:[25,35],iconAnchor:[12,35]})},recurso:{activo:i.divIcon({className:"custom-marker recurso-activo",html:'<div class="marker-pin"><i class="material-icons">build</i></div>',iconSize:[20,28],iconAnchor:[10,28]})},user:i.divIcon({className:"custom-marker user-position",html:'<div class="marker-pin user-pin"><i class="material-icons">person_pin</i></div>',iconSize:[25,35],iconAnchor:[12,35]})},this.loadMapData()}initializeMap(t,e){let a=o(o({},{center:[-12.0464,-77.0428],zoom:13,zoomControl:!0,attributionControl:!0}),e);return this.mapInstance=i.map(t,a),i.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"\xA9 OpenStreetMap contributors",maxZoom:19}).addTo(this.mapInstance),this.markersLayer=i.layerGroup().addTo(this.mapInstance),this.loadMarkersOnMap(),this.mapInstance}loadMapData(){return s(this,null,function*(){this.isLoadingSubject.next(!0);try{let t=yield this.loadAllMarkers();this.markersSubject.next(t)}catch{}finally{this.isLoadingSubject.next(!1)}})}loadAllMarkers(){return s(this,null,function*(){try{let t=this.directAuthService.getCurrentUser();if(!t)return[];let{data:e,error:r}=yield this.supabase.client.from("user_obras").select("obra_id").eq("user_id",t.id);if(r)throw r;if(!e||e.length===0)return[];let a=e.map(g=>g.obra_id),l=[],b=yield this.loadFrentesMarkers(a);l.push(...b);let v=yield this.loadActividadesMarkers(a);return l.push(...v),l}catch{return[]}})}loadFrentesMarkers(t){return s(this,null,function*(){try{let{data:e,error:r}=yield this.supabase.client.from("frentes").select(`
          id,
          nombre,
          descripcion,
          ubicacion_lat,
          ubicacion_lng,
          estado,
          progreso_general,
          obra:obras(nombre)
        `).in("obra_id",t).not("ubicacion_lat","is",null).not("ubicacion_lng","is",null);if(r)throw r;return(e||[]).map(a=>({id:a.id,lat:a.ubicacion_lat,lng:a.ubicacion_lng,title:a.nombre,description:`${a.descripcion||""} - Progreso: ${a.progreso_general}%`,type:"frente",status:a.estado,data:u(o({},a),{obra_nombre:Array.isArray(a.obra)?a.obra.length>0?a.obra[0].nombre:"Sin obra":a.obra?a.obra.nombre:"Sin obra"})}))}catch{return[]}})}loadActividadesMarkers(t){return s(this,null,function*(){try{let{data:e,error:r}=yield this.supabase.client.from("actividades").select(`
          id,
          tipo_actividad,
          ubicacion,
          estado,
          responsable,
          frente:frentes!inner(id, nombre, obra_id)
        `).in("frente.obra_id",t).not("ubicacion","is",null).in("estado",["ejecucion","programado"]);if(r)throw r;return(e||[]).map(a=>({id:a.id,lat:a.ubicacion?.lat||0,lng:a.ubicacion?.lng||0,title:a.tipo_actividad,description:`${a.responsable||"Sin responsable"}`,type:"actividad",status:a.estado==="ejecucion"?"activo":"inactivo",data:u(o({},a),{frente_nombre:Array.isArray(a.frente)?a.frente.length>0?a.frente[0].nombre:"Sin frente":a.frente?a.frente.nombre:"Sin frente"})}))}catch{return[]}})}loadMarkersOnMap(){!this.mapInstance||!this.markersLayer||this.markers$.subscribe(t=>{this.markersLayer&&(this.markersLayer.clearLayers(),t.forEach(e=>{this.addMarkerToMap(e)}),t.length>0&&this.fitBoundsToMarkers(t))})}addMarkerToMap(t){if(!this.markersLayer)return;let e=this.getMarkerIcon(t.type,t.status);i.marker([t.lat,t.lng],{icon:e}).bindPopup(this.createPopupContent(t)).bindTooltip(t.title,{permanent:!1,direction:"top",offset:[0,-35]}).addTo(this.markersLayer)}getMarkerIcon(t,e){return t==="frente"&&this.customIcons.frente[e]?this.customIcons.frente[e]:t==="actividad"&&this.customIcons.actividad[e]?this.customIcons.actividad[e]:t==="recurso"?this.customIcons.recurso.activo:this.customIcons.frente.activo}createPopupContent(t){let e=`
      <div class="map-popup">
        <h3 class="popup-title">${t.title}</h3>
        <p class="popup-description">${t.description||""}</p>
        <div class="popup-details">
          <span class="popup-type">${this.getTypeLabel(t.type)}</span>
          <span class="popup-status status-${t.status}">${this.getStatusLabel(t.status)}</span>
        </div>
    `;return t.data&&(t.type==="frente"?e+=`
          <div class="popup-extra">
            <p><strong>Obra:</strong> ${t.data.obra_nombre||"N/A"}</p>
            <p><strong>Progreso:</strong> ${t.data.progreso_general||0}%</p>
          </div>
        `:t.type==="actividad"&&(e+=`
          <div class="popup-extra">
            <p><strong>Frente:</strong> ${t.data.frente_nombre||"N/A"}</p>
            <p><strong>Responsable:</strong> ${t.data.responsable||"Sin asignar"}</p>
          </div>
        `)),e+=`
        <div class="popup-actions">
          <button class="btn-popup" onclick="window.mapService?.viewDetails('${t.type}', '${t.id}')">
            Ver Detalles
          </button>
        </div>
      </div>
    `,e}getTypeLabel(t){return{frente:"Frente",actividad:"Actividad",recurso:"Recurso",incidente:"Incidente"}[t]||t}getStatusLabel(t){return{activo:"Activo",inactivo:"Inactivo",completado:"Completado",alerta:"Alerta"}[t]||t}fitBoundsToMarkers(t){if(!this.mapInstance||t.length===0)return;let e=new i.FeatureGroup;t.forEach(r=>{i.marker([r.lat,r.lng]).addTo(e)}),this.mapInstance.fitBounds(e.getBounds(),{padding:[20,20]})}getCurrentPosition(){return s(this,null,function*(){return new Promise(t=>{if(!navigator.geolocation){t(null);return}navigator.geolocation.getCurrentPosition(e=>{let r={lat:e.coords.latitude,lng:e.coords.longitude,accuracy:e.coords.accuracy,timestamp:e.timestamp};this.currentPositionSubject.next(r),t(r)},e=>{t(null)},{enableHighAccuracy:!0,timeout:1e4,maximumAge:3e5})})})}addCurrentPositionMarker(){return s(this,null,function*(){let t=yield this.getCurrentPosition();if(!t||!this.mapInstance||!this.markersLayer)return;let e=i.marker([t.lat,t.lng],{icon:this.customIcons.user}).bindPopup("Tu ubicaci\xF3n actual").addTo(this.markersLayer);this.mapInstance.setView([t.lat,t.lng],16)})}addCustomMarker(t){let r=[...this.markersSubject.value,t];this.markersSubject.next(r)}removeMarker(t){let r=this.markersSubject.value.filter(a=>a.id!==t);this.markersSubject.next(r)}centerMap(t,e,r=15){this.mapInstance&&this.mapInstance.setView([t,e],r)}getMapInstance(){return this.mapInstance}refresh(){return s(this,null,function*(){yield this.loadMapData()})}destroy(){this.mapInstance&&(this.mapInstance.remove(),this.mapInstance=null),this.markersLayer=null}static{this.\u0275fac=function(e){return new(e||n)(p(h),p(m))}}static{this.\u0275prov=d({token:n,factory:n.\u0275fac,providedIn:"root"})}}return n})();window.mapService=null;export{L as a};
