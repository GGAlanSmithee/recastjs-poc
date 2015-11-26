"use strict";

import three from 'three';

var recast;

if (typeof module !== 'undefined' && module.exports) {
    recast = require('recastjs');
} else {
    recast = window.recast;
}

const loader = new three.OBJLoader();

function load() {
    return new Promise((resolve, reject) => {
        loader.load('nav_test.obj', function(object) {
            resolve(object);
        });
    }).then(object => {
        object.traverse(function(child) {
            if (child instanceof three.Mesh) {
                child.material.side = three.DoubleSide;
            }
        });
        
        return object;
    }).catch(err => {
        console.error(err);
    });
}

function loadNavmesh() {
    return new Promise((resolve, reject) => {
        recast.OBJLoader('nav_test.obj', function() {
            recast.buildTiled();
            
            resolve();
        });
    }).then(() => {
        return true;
    }).catch(err => {
        console.error(err);
    });
}

var scene;
var camera;
var MaxAgents = 50;
var agentBodies = new Map();

window.onload = async function() {
    const renderer = new three.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const agentRadius = 0.5;
    const agentHeight = 4.0;
    const cellSize = agentRadius / 2;
    const cellHeight = cellSize / 2;
    const agentMaxClimb = Math.ceil(agentHeight/2);
    
    recast.settings({
        cellSize: cellSize,
        cellHeight: cellHeight,
        agentHeight: agentHeight,
        agentRadius: agentRadius,
        agentMaxClimb: agentMaxClimb,
        agentMaxSlope: 30.0
    });

    recast.setGLContext(renderer.context);

    scene = new three.Scene();
    const [ object ] = await Promise.all([load(), loadNavmesh()]);
    scene.add(object);

    recast.initCrowd(1000, 1.0);

    const light = new three.AmbientLight(0x404040);
    scene.add(light);
    
    const directionalLight = new three.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
    
    camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 50;
    camera.lookAt(new three.Vector3(0, 0, 0));

    const controls = new three.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', function(){
        renderer.render(scene, camera);
    });

    for (let i = 0; i < MaxAgents; ++i) {
        var agentId = recast.addAgent({
                      position: {
                          x: -25,
                          y: -1,
                          z: -5
                      },
                      radius: agentRadius,
                      height: agentHeight,
                      maxAcceleration: 0.5,
                      maxSpeed: 1.0,
                      updateFlags: 0,// recast.CROWD_OBSTACLE_AVOIDANCE & recast.CROWD_ANTICIPATE_TURNS & recast.CROWD_OPTIMIZE_TOPO & recast.CROWD_SEPARATION,
                      separationWeight: 20.0
                  });
    
        let agentGeometry = new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight, 16);
        let agentBody = new THREE.Mesh(agentGeometry, new THREE.MeshBasicMaterial({ color: '#FF0000' }));
        agentBody.position.y = 1;
        
        let agent = new THREE.Object3D();
        agent.add(agentBody);
        
        agentBodies.set(agentId, agent);
        scene.add(agent);
    }
    
    recast.vent.on('update', function (agents) {
        for (var i = 0; i < agents.length; i++) {
            var a = agents[i];

            let agent = agentBodies.get(a.idx);
            
            let angle = Math.atan2(- a.velocity.z, a.velocity.x);
            
            if (Math.abs(agent.rotation.y - angle) > 0) {
                agent.rotation.y = angle;
            }
            
            agent.position.set(a.position.x, a.position.y, a.position.z);
        }
    });
    
    document.addEventListener('mouseup', onMouseUp);
    
    var delta, oldTime, newTime = 0;
    
    (function loop() {
    	requestAnimationFrame(loop);
    	
    	newTime = Date.now();
    	
    	delta = newTime - oldTime;
    	if (delta > 17) {
    	    delta = 17;
    	}
    	
    	oldTime = newTime;
    	
    	renderer.render(scene, camera);
    	
    	recast.crowdUpdate(delta / 100);
    	recast.crowdGetActiveAgents();
    })();
};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseUp(e) {
    e.preventDefault();
	e.stopPropagation();
	
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
	
	camera.updateMatrixWorld();
	
	raycaster.setFromCamera(mouse, camera);
	
	const intersection = raycaster.intersectObject(scene, true)[0];
	
	if (intersection === undefined) {
	    return;
	}
	
	const point = intersection.point;
	
	for (let agentId of agentBodies.keys()) {
	    recast.crowdRequestMoveTarget(agentId, point.x, point.y, point.z);
	}
};
				
/**
 * Load an .OBJ file
 */
// recast.OBJLoader('nav_test.obj', function(){

//     recast.buildTiled();
//     // recast.loadTileMesh('./navmesh.dist.bin', recast.cb(function(){
//     //recast.loadTileCache('./tilecache.dist.bin', recast.cb(function(){

//     recast.initCrowd(1000, 1.0);

//     recast.vent.on('update', function (agents) {
//         for (var i = 0; i < agents.length; i++) {
//             var agent = agents[i];

//             var angle = Math.atan2(- agent.velocity.z, agent.velocity.x);
//             if (Math.abs(agentsObjects[agent.idx].rotation.y - angle) > 0) {
//                 agentsObjects[agent.idx].rotation.y = angle;
//             }

//             agentsObjects[agent.idx].position.set(
//                 agent.position.x,
//                 agent.position.y,
//                 agent.position.z
//             );
//         }
//     });

//     /**
//      * Add some agents
//      */
//     for (var i = 0; i < agentsObjects.length; i++) {
//         agents.push(recast.addAgent({
//             position: {
//                 x: -25.8850,
//                 y: -1.64166,
//                 z: -5.41350
//             },
//             radius: 0.8,
//             height: 0.5,
//             maxAcceleration: 1.0,
//             maxSpeed: 2.0,
//             updateFlags: 0, // && recast.CROWD_OBSTACLE_AVOIDANCE, // & recast.CROWD_ANTICIPATE_TURNS & recast.CROWD_OPTIMIZE_TOPO & recast.CROWD_SEPARATION,
//             separationWeight: 20.0
//         }));
//     }

//     var routes;

//     var last = new Date().getTime();
//     var animate = function animate (time) {

//         setTimeout(function () {
//             recast.crowdUpdate(0.1);
//             recast.crowdGetActiveAgents();
//         }, 0);

//         window.requestAnimationFrame(animate);

//         last = time;
//         render();

//         if (stats) stats.update();
//     };

//     animate(new Date().getTime());

//     sequence = function() {
//         document.getElementById('sequence').style.display = 'none';
//         routes = 0;
//         goAway();
//     };

//     var goAway = function(){
//         for (var i = 0; i < agentsObjects.length; i++) {
//             (function (i) {
//                 recast.getRandomPoint(recast.cb(function(pt2x, pt2y, pt2z){
//                     recast.crowdRequestMoveTarget(i, pt2x, pt2y, pt2z);
//                     if (++routes < MAX_HOPS) {
//                         test.ok(true, 'route ' + routes + ': to ' + Math.round(pt2x, 2) + ',' + Math.round(pt2y, 2)+ ',' + Math.round(pt2z, 2));
//                         setTimeout(goAway, 8000 * Math.random());
//                     } else {
//                         document.getElementById('sequence').style.display = 'block';
//                         // test.done();
//                     }
//                 }));
//             })(i);
//         }
//     };

//     sequence();
//   }));
// });