/**
 * Class: UndoRedo
 * Instance of this class can be used to undo and redo vector edits.
 */
 

OpenLayers.Control.UndoRedo = OpenLayers.Class(OpenLayers.Control,{
	/**
	 * APIProperty: currentEditIndex
	 * {integer} - sequence number for editing the feature[s] 
	 */
	currentEditIndex: 0,
	/**
	 * Property: undoFeatures
	 * {array} - stack of the edit features
	 */
	undoFeatures: [],
	/**
	 * Property: redoFeatures
	 * {array} - stack of the undo features
	 */
	redoFeatures: [],
	/**
	 * Property: isEditMulty
	 * {boolean} - true if in one action multiple features are editied 
	 */
	isEditMulty: false,
	
	/**
	 * Constructor: UndoRedo
	 * Parameters:
	 * layers - array of {<OpenLayers.Layers.Vector>}
	 */
	initialize: function(layers){
		if (!(layers instanceof Array)) {
			layers = [layers];
			logspan(layers);
		}
		for(var i=0;i<layers.length; i++){
			layers[i].events.register("sketchstarted",this,this.onSketchStarted);
			layers[i].events.register("featureadded",this,this.onInsert);
       		layers[i].events.register("beforefeatureremoved",this,this.onDelete);
       		layers[i].events.register("beforefeaturemodified",this,this.onUpdate);
		}
	},
	/**
	 * Method: onEdit
	 * on any edit operation performed this has to be triggred
	 * i.e. on insert, delete, update 
	 * Parameters: 
	 * feature - {<OpenLayers.Feature.Vector>}
	 * editType - {string} edit type done "Insert","Delete","Update"
	 * component - {string} layer or any other identifier
	 * Returns: 
	 */	 
	onEdit: function(feature,editType,component){
		logspan("Updating undo stack as there is - "+editType);
		if (component == undefined){
			component = feature.layer.name;
		}
		if (this.undoFeatures[this.currentEditIndex] == undefined) { 
			this.undoFeatures[this.currentEditIndex] = {};
			this.undoFeatures[this.currentEditIndex][component] = {"Insert":[],"Update":[],"Delete":[]};
		}
		if(feature.fid == undefined){
			feature.fid = feature.id;
		}	
		this.undoFeatures[this.currentEditIndex][component][editType].push(feature);
		this.redoFeatures.splice(0,this.redoFeatures.length);
	},
	
	/** 
	 * Method: onSketchStarted
	 * event handler for sketchstarted
	 */
	onSketchStarted: function(event){
		this.increaseEditIndex();
		logspan("currentEditIndex: "+this.currentEditIndex);
		return true;
	},
	
	/**
	 * Method: onInsert
	 * event haldler for featureadded 
	 */
	onInsert: function(event){	
	App.button1.activate();
		feature = event.feature.clone();
		if(event.feature.fid == undefined) {
			event.feature.fid = event.feature.id;
		}
		feature.fid = event.feature.fid;
		feature.state = event.feature.state;
		feature.layer = event.feature.layer;
		this.onEdit(feature,"Insert",feature.layer.name);
		return true;
	},
	
	/**
	 * Method: onDelete
	 * event haldler for beforefeatureremoved 
	 */
	onDelete: function(event){
		this.increaseEditIndex();
		this.onEdit(event.feature,"Delete",event.feature.layer.name);
		return true;
	},
	
	/**
	 * Method: onUpdate
	 * event haldler for beforefeaturemodified
	 */
	onUpdate: function(event){
		this.increaseEditIndex();
		logspan("old feature geometry: " + event.feature.geometry);
		feature = event.feature.clone();
		feature.fid = event.feature.fid;
		feature.state = event.feature.state;
		feature.layer = event.feature.layer;
		this.onEdit(feature,"Update",feature.layer.name);
		return true;
	},
	
	/**
	 * Method: increaseEditIndex
	 * increase the editIndex
	 */
	increaseEditIndex: function(){
		if(this.currentEditIndex < this.undoFeatures.length ){
        	this.currentEditIndex +=1;
        }
	},
	
	/**
	 * Method: getUndoData
	 * returns the last edited data
	 */ 
	getUndoData: function(){
		var data = this.undoFeatures.pop();
		this.currentEditIndex -= 1;
		return data; 	
	},
	
	/* Method: getRedoData
	 * returns the last redo data
	 */
	getRedoData: function() {	
		var data = this.redoFeatures.pop();
		this.currentEditIndex += 1;
		return data;
	},
	
	/**
	 * APIMethod: reseteditIndex
	 * reset the editIndex to 0 and empety both undo and redo stack
	 */
	resetEditIndex: function(){
		this.currentEditIndex = 0;
		this.undoFeatures.splice(0,this.undoFeatures.length);
		this.redoFeatures.splice(0,this.redoFeatures.length);
	},
	
	/**
	 * APIMethod: undo
	 * perform undo operation 
	 */
	undo: function() {	
		App.button2.activate();
		data = this.getUndoData();
		
		if(!data)
		{
			//if(App.alert.undo<1)
			//{
			alert("no data / nothing to undo");
			//App.alert.undo=1;
			//}
			//else
			//{
			//	logspan("please click again");
			//}
			
		}
		
		else
		{
		
		logspan("data :" + data);
		for (component in data){
			logspan("component: "+component);
			layer=map.getLayersByName(component)[0];
			logspan("got layer, name: " + layer.name);
			for (editType in data[component]){
				logspan("edittype : "+editType);
				for(var i=0;i<data[component][editType].length;i++){
					feature=data[component][editType][i];
					logspan("features before undo: "+layer.features.length);
					switch(editType) {
						case "Insert":
							logspan("insert");						
							//layer.drawFeature(feature,{display : "none"});
							insertedFeature = layer.getFeatureByFid(feature.fid);
							layer.eraseFeatures(insertedFeature);
							OpenLayers.Util.removeItem(layer.features,insertedFeature);
							break;
						case "Delete":
							logspan("delete");
							layer.features.push(feature);
							layer.drawFeature(feature);
							break;
						case "Update":
							logspan("update");
							updatedFeature = layer.getFeatureByFid(feature.fid);
							logspan("old feature geometry: " + feature.geometry);
							logspan("updated feature geometry: " + updatedFeature.geometry);
							//layer.drawFeature(updatedFeature,{display : "none"});
							layer.eraseFeatures(updatedFeature);
							OpenLayers.Util.removeItem(layer.features,updatedFeature);						
							//layer.removeFeatures(updatedFeature);
							logspan("old feature geometry: " + feature.geometry);
							layer.features.push(feature);
							layer.drawFeature(feature);
							data[component][editType][i]= updatedFeature;
							break;
						default:
							logspan("unkown");
							break;				
					}
					logspan("features after undo: "+layer.features.length);
				}
			}
		}
		this.redoFeatures.push(data);
			
		}
	},
	
	/**
	 * APIMethod:  redo
	 * perform redo operation
	 */
	
	redo: function(){
		
		data =this.getRedoData();
		if(!data)
		{
			//if(App.alert<1)
			//{
				alert("no data / nothing to redo");
			//App.alert=1;
			//}
			//else
			//{
			//	logspan("please click again");
			//}
			
		}
		else
		{
			for( component in data) {
			logspan("component: "+component);
			layer=map.getLayersByName(component)[0];
			logspan("got layer, name: " + layer.name);
			for(editType in data[component]){
				logspan("edittype : "+editType);
				for (var i=0;i<data[component][editType].length;i++){
					feature=data[component][editType][i];
					logspan("features before redo: "+layer.features.length);	
					switch(editType) {
						case "Insert":
							logspan("Insert");
							layer.features.push(feature);
							layer.drawFeature(feature);
							break;
						case "Delete":
							logspan("Delete");
							deleteFeature = layer.getFeatureByFid(feature.fid)
							layer.eraseFeatures(deleteFeature);
							OpenLayers.Util.removeItem(layer.features,deleteFeature);	
							break;
						case "Update":
							logspan("Update");
							oldFeature = layer.getFeatureByFid(feature.fid);
							logspan("old feature id: " + oldFeature.id);
							layer.eraseFeatures(oldFeature);
							OpenLayers.Util.removeItem(layer.features,oldFeature);
							logspan("updated feature id: " + oldFeature.id);
							layer.features.push(feature);
							layer.drawFeature(feature);
							data[component][editType][i]= oldFeature;
							break;
						default:
							break; 
					}
				}
			}
		}
		this.undoFeatures.push(data);
			
		}
		
	},

	CLASS_NAME : "UndoRedo"
});	
