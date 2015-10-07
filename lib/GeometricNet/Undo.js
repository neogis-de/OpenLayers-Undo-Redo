
currentEditIndex = 0;
undoFeatures = [];
redoFeatures = [];
isEditMulty = false;
/**
 * before any edit operation performed this has to be triggred
 * i.e. on delete, update 
 * Parameters: 
 * feature - old feature
 * component - layer or any other identifier
 * Returns: 
 */
 
onEdit = function(feature,editType,component){
	console.log("Updating undo stack as there is - "+editType);
	if (component == undefined){
		component = feature.layer.name;
	}
	if (undoFeatures[currentEditIndex] == undefined) {
		undoFeatures[currentEditIndex] = {};
		undoFeatures[currentEditIndex][component] = {"Insert":[],"Update":[],"Delete":[]};
	}
	if(feature.fid == undefined){
		feature.fid = feature.id;
	}	
	undoFeatures[currentEditIndex][component][editType].push(feature);
	redoFeatures.splice(0,redoFeatures.length);
	//run increase editIndex outside after this in case of multy feature edit
	if(!isEditMulty){
		setEditIndex();	
	}
};

onInsert = function(event){	
	//onEdit(event.feature,"Insert",event.feature.layer.name);
	feature = event.feature.clone();
	if(event.feature.fid == undefined) {
		event.feature.fid = event.feature.id;
	}
	feature.fid = event.feature.fid;
	feature.state = event.feature.state;
	feature.layer = event.feature.layer;
	onEdit(feature,"Insert",feature.layer.name);
}
onDelete = function(event){
	onEdit(event.feature,"Delete",event.feature.layer.name);
}
onUpdate = function(event){
	console.log("old feature geometry: " + event.feature.geometry);
	feature = event.feature.clone();
	feature.fid = event.feature.fid;
	feature.state = event.feature.state;
	feature.layer = event.feature.layer;
	onEdit(feature,"Update",feature.layer.name);
}

setEditIndex = function(delta){
	delta = delta ? delta : 1;
	currentEditIndex += delta
};


/**
 * after any edit operation performed this has to be triggred
 * i.e. on insert, update of new feature
 * Parameters: 
 * feature - new feature
 * component - layer or any other identifier
 * Returns: 
 */
/*
onEdit = function(feature,component,editType){
	feature.editIndex = currentEditIndex;
	//run increase editIndex outside after this
} */

getUndoData = function(){
	var data = undoFeatures.pop();
	currentEditIndex -= 1;
	return data; 	
};

getRedoData = function() {	
	var data = redoFeatures.pop();
	currentEditIndex += 1;
	return data;
};

resetEditIndex = function(){
	currentEditIndex = 0;
	undoFeatures.splice(0,undoFeatures.length);
	redoFeatures.splice(0,redoFeatures.length);
};

undo = function() {	
	data = getUndoData();
	console.log("data :" + data);
	for (component in data){
		console.log("component: "+component);
		layer=map.getLayersByName(component)[0];
		console.log("got layer, name: " + layer.name);
		for (editType in data[component]){
			console.log("edittype : "+editType);
			for(var i=0;i<data[component][editType].length;i++){
				feature=data[component][editType][i];
				console.log("features before undo: "+layer.features.length);
				switch(editType) {
					case "Insert":
						console.log("insert");						
						//layer.drawFeature(feature,{display : "none"});
						insertedFeature = layer.getFeatureByFid(feature.fid);
						layer.eraseFeatures(insertedFeature);
						OpenLayers.Util.removeItem(layer.features,insertedFeature);
						redoFeatures.push(data);
						break;
					case "Delete":
						console.log("delete");
						layer.features.push(feature);
						layer.drawFeature(feature);
						redoFeatures.push(data);
						break;
					case "Update":
						console.log("update");
						updatedFeature = layer.getFeatureByFid(feature.fid);
						console.log("old feature geometry: " + feature.geometry);
						console.log("updated feature geometry: " + updatedFeature.geometry);
						//layer.drawFeature(updatedFeature,{display : "none"});
						layer.eraseFeatures(updatedFeature);
						OpenLayers.Util.removeItem(layer.features,updatedFeature);						
						//layer.removeFeatures(updatedFeature);
						console.log("old feature geometry: " + feature.geometry);
						layer.features.push(feature);
						layer.drawFeature(feature);
						data[component][editType][i]= updatedFeature;
						redoFeatures.push(data);
						break;
					default:
						console.log("unkown");
						break;				
				}
				console.log("features after undo: "+layer.features.length);
			}
		}
	}
};

redo= function(){
	data =getRedoData();
	for( component in data) {
		console.log("component: "+component);
		layer=map.getLayersByName(component)[0];
		console.log("got layer, name: " + layer.name);
		for(editType in data[component]){
			console.log("edittype : "+editType);
			for (var i=0;i<data[component][editType].length;i++){
				feature=data[component][editType][i];
				console.log("features before redo: "+layer.features.length);	
				switch(editType) {
					case "Insert":
						console.log("Insert");
						layer.features.push(feature);
						layer.drawFeature(feature);
						undoFeatures.push(data);
						break;
					case "Delete":
						console.log("Delete");
						deleteFeature = layer.getFeatureByFid(feature.fid)
						layer.eraseFeatures(deleteFeature);
						OpenLayers.Util.removeItem(layer.features,deleteFeature);	
						undoFeatures.push(data);
						break;
					case "Update":
						console.log("Update");
						oldFeature = layer.getFeatureByFid(feature.fid);
						console.log("old feature id: " + oldFeature.id);
						layer.eraseFeatures(oldFeature);
						OpenLayers.Util.removeItem(layer.features,oldFeature);
						console.log("updated feature id: " + oldFeature.id);
						layer.features.push(feature);
						layer.drawFeature(feature);
						data[component][editType][i]= oldFeature;
						undoFeatures.push(data);
						break;
					default:
						break; 
				}
			}
		}
	}
}

/*
//undo -insert
l = map.layers[1];
f= l.features[1];
onEdit(f,"Insert",l.name);
undoOnLayers();


//undo - update
l = map.layers[1];
f= l.features[1];
oldf = f.clone();
oldf.fid = f.fid;
onEdit(oldf,"Update",l.name);
l.drawFeature(f,{display:"none"});
g = OpenLayers.Geometry.fromWKT("POINT(-701876.05423076 7043774.277712)");
f.geometry = g;
l.drawFeature(f);
undoOnLayers();

//delete
l=map.layers[1];
f = l.features[1];
onEdit(f,"Delete",l.name);
l.eraseFeatures(f)
l.removeFeature(f);

*/
