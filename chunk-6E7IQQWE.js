import{a as k}from"./chunk-NXOYKD4N.js";import{a as h}from"./chunk-4SALBWPR.js";import{c as m}from"./chunk-ZJYJPMQY.js";import{ba as d,g as c,ga as p}from"./chunk-OYRL5FJJ.js";import{a as n,b as u,g as f,i}from"./chunk-ODN5LVDJ.js";var s=f(k());var L=(()=>{class o{constructor(t,e){this.supabase=t,this.authService=e,this.mapInstance=null,this.markersLayer=null,this.markersSubject=new c([]),this.markers$=this.markersSubject.asObservable(),this.currentPositionSubject=new c(null),this.currentPosition$=this.currentPositionSubject.asObservable(),this.isLoadingSubject=new c(!1),this.isLoading$=this.isLoadingSubject.asObservable(),this.customIcons={frente:{activo:s.divIcon({className:"custom-marker frente-activo",html:'<div class="marker-pin"><i class="material-icons">construction</i></div>',iconSize:[30,42],iconAnchor:[15,42]}),inactivo:s.divIcon({className:"custom-marker frente-inactivo",html:'<div class="marker-pin"><i class="material-icons">pause_circle</i></div>',iconSize:[30,42],iconAnchor:[15,42]}),completado:s.divIcon({className:"custom-marker frente-completado",html:'<div class="marker-pin"><i class="material-icons">check_circle</i></div>',iconSize:[30,42],iconAnchor:[15,42]})},actividad:{activo:s.divIcon({className:"custom-marker actividad-activo",html:'<div class="marker-pin"><i class="material-icons">assignment</i></div>',iconSize:[25,35],iconAnchor:[12,35]}),alerta:s.divIcon({className:"custom-marker actividad-alerta",html:'<div class="marker-pin"><i class="material-icons">warning</i></div>',iconSize:[25,35],iconAnchor:[12,35]})},recurso:{activo:s.divIcon({className:"custom-marker recurso-activo",html:'<div class="marker-pin"><i class="material-icons">build</i></div>',iconSize:[20,28],iconAnchor:[10,28]})},user:s.divIcon({className:"custom-marker user-position",html:'<div class="marker-pin user-pin"><i class="material-icons">person_pin</i></div>',iconSize:[25,35],iconAnchor:[12,35]})},this.loadMapData()}initializeMap(t,e){let r=n(n({},{center:[-12.0464,-77.0428],zoom:13,zoomControl:!0,attributionControl:!0}),e);return this.mapInstance=s.map(t,r),s.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"\xA9 OpenStreetMap contributors",maxZoom:19}).addTo(this.mapInstance),this.markersLayer=s.layerGroup().addTo(this.mapInstance),this.loadMarkersOnMap(),this.mapInstance}loadMapData(){return i(this,null,function*(){this.isLoadingSubject.next(!0);try{let t=yield this.loadAllMarkers();this.markersSubject.next(t)}catch(t){console.error("Error loading map data:",t)}finally{this.isLoadingSubject.next(!1)}})}loadAllMarkers(){return i(this,null,function*(){try{let t=yield this.authService.getCurrentUser();if(!t)return[];let{data:e,error:a}=yield this.supabase.client.from("user_obras").select("obra_id").eq("user_id",t.id);if(a)throw a;if(!e||e.length===0)return[];let r=e.map(v=>v.obra_id),l=[],b=yield this.loadFrentesMarkers(r);l.push(...b);let g=yield this.loadActividadesMarkers(r);return l.push(...g),l}catch(t){return console.error("Error loading markers:",t),[]}})}loadFrentesMarkers(t){return i(this,null,function*(){try{let{data:e,error:a}=yield this.supabase.client.from("frentes").select(`
          id,
          nombre,
          descripcion,
          ubicacion_lat,
          ubicacion_lng,
          estado,
          progreso_general,
          obra:obras(nombre)
        `).in("obra_id",t).not("ubicacion_lat","is",null).not("ubicacion_lng","is",null);if(a)throw a;return(e||[]).map(r=>({id:r.id,lat:r.ubicacion_lat,lng:r.ubicacion_lng,title:r.nombre,description:`${r.descripcion||""} - Progreso: ${r.progreso_general}%`,type:"frente",status:r.estado,data:u(n({},r),{obra_nombre:Array.isArray(r.obra)?r.obra.length>0?r.obra[0].nombre:"Sin obra":r.obra?r.obra.nombre:"Sin obra"})}))}catch(e){return console.error("Error loading frentes markers:",e),[]}})}loadActividadesMarkers(t){return i(this,null,function*(){try{let{data:e,error:a}=yield this.supabase.client.from("actividades").select(`
          id,
          tipo_actividad,
          ubicacion,
          estado,
          responsable,
          frente:frentes!inner(id, nombre, obra_id)
        `).in("frente.obra_id",t).not("ubicacion","is",null).in("estado",["ejecucion","programado"]);if(a)throw a;return(e||[]).map(r=>({id:r.id,lat:r.ubicacion?.lat||0,lng:r.ubicacion?.lng||0,title:r.tipo_actividad,description:`${r.responsable||"Sin responsable"}`,type:"actividad",status:r.estado==="ejecucion"?"activo":"inactivo",data:u(n({},r),{frente_nombre:Array.isArray(r.frente)?r.frente.length>0?r.frente[0].nombre:"Sin frente":r.frente?r.frente.nombre:"Sin frente"})}))}catch(e){return console.error("Error loading actividades markers:",e),[]}})}loadMarkersOnMap(){!this.mapInstance||!this.markersLayer||this.markers$.subscribe(t=>{this.markersLayer&&(this.markersLayer.clearLayers(),t.forEach(e=>{this.addMarkerToMap(e)}),t.length>0&&this.fitBoundsToMarkers(t))})}addMarkerToMap(t){if(!this.markersLayer)return;let e=this.getMarkerIcon(t.type,t.status);s.marker([t.lat,t.lng],{icon:e}).bindPopup(this.createPopupContent(t)).bindTooltip(t.title,{permanent:!1,direction:"top",offset:[0,-35]}).addTo(this.markersLayer)}getMarkerIcon(t,e){return t==="frente"&&this.customIcons.frente[e]?this.customIcons.frente[e]:t==="actividad"&&this.customIcons.actividad[e]?this.customIcons.actividad[e]:t==="recurso"?this.customIcons.recurso.activo:this.customIcons.frente.activo}createPopupContent(t){let e=`
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
    `,e}getTypeLabel(t){return{frente:"Frente",actividad:"Actividad",recurso:"Recurso",incidente:"Incidente"}[t]||t}getStatusLabel(t){return{activo:"Activo",inactivo:"Inactivo",completado:"Completado",alerta:"Alerta"}[t]||t}fitBoundsToMarkers(t){if(!this.mapInstance||t.length===0)return;let e=new s.FeatureGroup;t.forEach(a=>{s.marker([a.lat,a.lng]).addTo(e)}),this.mapInstance.fitBounds(e.getBounds(),{padding:[20,20]})}getCurrentPosition(){return i(this,null,function*(){return new Promise(t=>{if(!navigator.geolocation){console.error("Geolocation is not supported by this browser."),t(null);return}navigator.geolocation.getCurrentPosition(e=>{let a={lat:e.coords.latitude,lng:e.coords.longitude,accuracy:e.coords.accuracy,timestamp:e.timestamp};this.currentPositionSubject.next(a),t(a)},e=>{console.error("Error getting current position:",e),t(null)},{enableHighAccuracy:!0,timeout:1e4,maximumAge:3e5})})})}addCurrentPositionMarker(){return i(this,null,function*(){let t=yield this.getCurrentPosition();if(!t||!this.mapInstance||!this.markersLayer)return;let e=s.marker([t.lat,t.lng],{icon:this.customIcons.user}).bindPopup("Tu ubicaci\xF3n actual").addTo(this.markersLayer);this.mapInstance.setView([t.lat,t.lng],16)})}addCustomMarker(t){let a=[...this.markersSubject.value,t];this.markersSubject.next(a)}removeMarker(t){let a=this.markersSubject.value.filter(r=>r.id!==t);this.markersSubject.next(a)}centerMap(t,e,a=15){this.mapInstance&&this.mapInstance.setView([t,e],a)}getMapInstance(){return this.mapInstance}refresh(){return i(this,null,function*(){yield this.loadMapData()})}destroy(){this.mapInstance&&(this.mapInstance.remove(),this.mapInstance=null),this.markersLayer=null}static{this.\u0275fac=function(e){return new(e||o)(p(m),p(h))}}static{this.\u0275prov=d({token:o,factory:o.\u0275fac,providedIn:"root"})}}return o})();window.mapService=null;export{L as a};
