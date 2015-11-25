(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('three')) :
    typeof define === 'function' && define.amd ? define('Test', ['three'], factory) :
    factory(global.THREE);
}(this, function (three) { 'use strict';

    three = 'default' in three ? three['default'] : three;

    var babelHelpers = {};

    babelHelpers.asyncToGenerator = function (fn) {
      return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
          var callNext = step.bind(null, "next");
          var callThrow = step.bind(null, "throw");

          function step(key, arg) {
            try {
              var info = gen[key](arg);
              var value = info.value;
            } catch (error) {
              reject(error);
              return;
            }

            if (info.done) {
              resolve(value);
            } else {
              Promise.resolve(value).then(callNext, callThrow);
            }
          }

          callNext();
        });
      };
    };

    babelHelpers.slicedToArray = (function () {
      function sliceIterator(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;

        try {
          for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);

            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"]) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }

        return _arr;
      }

      return function (arr, i) {
        if (Array.isArray(arr)) {
          return arr;
        } else if (Symbol.iterator in Object(arr)) {
          return sliceIterator(arr, i);
        } else {
          throw new TypeError("Invalid attempt to destructure non-iterable instance");
        }
      };
    })();

    babelHelpers;
    var recast;

    if (typeof module !== 'undefined' && module.exports) {
        recast = require('recastjs');
    } else {
        recast = window.recast;
    }

    var loader = new three.OBJLoader();

    function load() {
        return new Promise(function (resolve, reject) {
            loader.load('nav_test.obj', function (object) {
                resolve(object);
            });
        }).then(function (object) {
            object.traverse(function (child) {
                if (child instanceof three.Mesh) {
                    child.material.side = three.DoubleSide;
                }
            });

            return object;
        }).catch(function (err) {
            console.error(err);
        });
    }

    function loadNavmesh() {
        return new Promise(function (resolve, reject) {
            recast.OBJLoader('nav_test.obj', function () {
                recast.buildTiled();

                resolve();
            });
        }).then(function () {
            return true;
        }).catch(function (err) {
            console.error(err);
        });
    }

    var scene;
    var camera;
    var agentId;

    window.onload = babelHelpers.asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var renderer, agentRadius, agentHeight, cellSize, cellHeight, agentMaxClimb, _ref, _ref2, object, light, directionalLight, controls, agentGeometry, agent, agentBody, delta, oldTime, newTime;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        renderer = new three.WebGLRenderer({ antialias: true });

                        renderer.setSize(window.innerWidth, window.innerHeight);
                        document.body.appendChild(renderer.domElement);

                        agentRadius = 0.5;
                        agentHeight = 4.0;
                        cellSize = agentRadius / 2;
                        cellHeight = cellSize / 2;
                        agentMaxClimb = Math.ceil(agentHeight / 2);

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
                        _context.next = 13;
                        return Promise.all([load(), loadNavmesh()]);

                    case 13:
                        _ref = _context.sent;
                        _ref2 = babelHelpers.slicedToArray(_ref, 1);
                        object = _ref2[0];

                        scene.add(object);

                        recast.initCrowd(1000, 1.0);

                        light = new three.AmbientLight(0x404040);

                        scene.add(light);

                        directionalLight = new three.DirectionalLight(0xffffff, 0.5);

                        directionalLight.position.set(0, 1, 0);
                        scene.add(directionalLight);

                        camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                        camera.position.y = 50;
                        camera.lookAt(new three.Vector3(0, 0, 0));

                        controls = new three.OrbitControls(camera, renderer.domElement);

                        controls.addEventListener('change', function () {
                            renderer.render(scene, camera);
                        });

                        agentId = recast.addAgent({
                            position: {
                                x: -25.8850,
                                y: -1.64166,
                                z: -5.41350
                            },
                            radius: agentRadius,
                            height: agentHeight,
                            maxAcceleration: 0.5,
                            maxSpeed: 1.0,
                            updateFlags: 0, // && recast.CROWD_OBSTACLE_AVOIDANCE, // & recast.CROWD_ANTICIPATE_TURNS & recast.CROWD_OPTIMIZE_TOPO & recast.CROWD_SEPARATION,
                            separationWeight: 20.0
                        });

                        agentGeometry = new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight, 16);
                        agent = new THREE.Object3D();
                        agentBody = new THREE.Mesh(agentGeometry, new THREE.MeshBasicMaterial({
                            color: '#FF0000'
                        }));

                        agentBody.position.y = 1;
                        agent.add(agentBody);

                        agent.position.x = -25.8850;
                        agent.position.y = -1.64166;
                        agent.position.z = -5.41350;

                        scene.add(agent);

                        recast.vent.on('update', function (agents) {
                            for (var i = 0; i < agents.length; i++) {
                                var a = agents[i];

                                var angle = Math.atan2(-a.velocity.z, a.velocity.x);
                                if (Math.abs(agent.rotation.y - angle) > 0) {
                                    agent.rotation.y = angle;
                                }

                                agent.position.set(a.position.x, a.position.y, a.position.z);
                            }
                        });

                        document.addEventListener('mouseup', onMouseUp);

                        newTime = 0;

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

                    case 42:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    function onMouseUp(e) {
        e.preventDefault();
        e.stopPropagation();

        mouse.x = e.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        camera.updateMatrixWorld();

        raycaster.setFromCamera(mouse, camera);

        var intersection = raycaster.intersectObject(scene, true)[0];

        if (intersection === undefined) {
            return;
        }

        var point = intersection.point;

        recast.crowdRequestMoveTarget(agentId, point.x, point.y, point.z);
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

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi8vaG9tZS91YnVudHUvd29ya3NwYWNlL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHRocmVlIGZyb20gJ3RocmVlJztcblxudmFyIHJlY2FzdDtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgcmVjYXN0ID0gcmVxdWlyZSgncmVjYXN0anMnKTtcbn0gZWxzZSB7XG4gICAgcmVjYXN0ID0gd2luZG93LnJlY2FzdDtcbn1cblxuY29uc3QgbG9hZGVyID0gbmV3IHRocmVlLk9CSkxvYWRlcigpO1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxvYWRlci5sb2FkKCduYXZfdGVzdC5vYmonLCBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICAgIHJlc29sdmUob2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfSkudGhlbihvYmplY3QgPT4ge1xuICAgICAgICBvYmplY3QudHJhdmVyc2UoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIHRocmVlLk1lc2gpIHtcbiAgICAgICAgICAgICAgICBjaGlsZC5tYXRlcmlhbC5zaWRlID0gdGhyZWUuRG91YmxlU2lkZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gbG9hZE5hdm1lc2goKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcmVjYXN0Lk9CSkxvYWRlcignbmF2X3Rlc3Qub2JqJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWNhc3QuYnVpbGRUaWxlZCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59XG5cbnZhciBzY2VuZTtcbnZhciBjYW1lcmE7XG52YXIgYWdlbnRJZDtcblxud2luZG93Lm9ubG9hZCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbmV3IHRocmVlLldlYkdMUmVuZGVyZXIoe2FudGlhbGlhczogdHJ1ZX0pO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcbiAgICBcbiAgICBjb25zdCBhZ2VudFJhZGl1cyA9IDAuNTtcbiAgICBjb25zdCBhZ2VudEhlaWdodCA9IDQuMDtcbiAgICBjb25zdCBjZWxsU2l6ZSA9IGFnZW50UmFkaXVzIC8gMjtcbiAgICBjb25zdCBjZWxsSGVpZ2h0ID0gY2VsbFNpemUgLyAyO1xuICAgIGNvbnN0IGFnZW50TWF4Q2xpbWIgPSBNYXRoLmNlaWwoYWdlbnRIZWlnaHQvMik7XG4gICAgXG4gICAgcmVjYXN0LnNldHRpbmdzKHtcbiAgICAgICAgY2VsbFNpemU6IGNlbGxTaXplLFxuICAgICAgICBjZWxsSGVpZ2h0OiBjZWxsSGVpZ2h0LFxuICAgICAgICBhZ2VudEhlaWdodDogYWdlbnRIZWlnaHQsXG4gICAgICAgIGFnZW50UmFkaXVzOiBhZ2VudFJhZGl1cyxcbiAgICAgICAgYWdlbnRNYXhDbGltYjogYWdlbnRNYXhDbGltYixcbiAgICAgICAgYWdlbnRNYXhTbG9wZTogMzAuMFxuICAgIH0pO1xuXG4gICAgcmVjYXN0LnNldEdMQ29udGV4dChyZW5kZXJlci5jb250ZXh0KTtcblxuICAgIHNjZW5lID0gbmV3IHRocmVlLlNjZW5lKCk7XG4gICAgY29uc3QgWyBvYmplY3QgXSA9IGF3YWl0IFByb21pc2UuYWxsKFtsb2FkKCksIGxvYWROYXZtZXNoKCldKTtcbiAgICBzY2VuZS5hZGQob2JqZWN0KTtcblxuICAgIHJlY2FzdC5pbml0Q3Jvd2QoMTAwMCwgMS4wKTtcblxuICAgIGNvbnN0IGxpZ2h0ID0gbmV3IHRocmVlLkFtYmllbnRMaWdodCgweDQwNDA0MCk7XG4gICAgc2NlbmUuYWRkKGxpZ2h0KTtcbiAgICBcbiAgICBjb25zdCBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IHRocmVlLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDAuNSk7XG4gICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5zZXQoMCwgMSwgMCk7XG4gICAgc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQpO1xuICAgIFxuICAgIGNhbWVyYSA9IG5ldyB0aHJlZS5QZXJzcGVjdGl2ZUNhbWVyYSg3NSwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMCk7XG4gICAgY2FtZXJhLnBvc2l0aW9uLnkgPSA1MDtcbiAgICBjYW1lcmEubG9va0F0KG5ldyB0aHJlZS5WZWN0b3IzKDAsIDAsIDApKTtcblxuICAgIGNvbnN0IGNvbnRyb2xzID0gbmV3IHRocmVlLk9yYml0Q29udHJvbHMoY2FtZXJhLCByZW5kZXJlci5kb21FbGVtZW50KTtcbiAgICBjb250cm9scy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpe1xuICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgfSk7XG5cbiAgICBhZ2VudElkID0gcmVjYXN0LmFkZEFnZW50KHtcbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgeDogLTI1Ljg4NTAsXG4gICAgICAgICAgICAgICAgICAgICAgeTogLTEuNjQxNjYsXG4gICAgICAgICAgICAgICAgICAgICAgejogLTUuNDEzNTBcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICByYWRpdXM6IGFnZW50UmFkaXVzLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhZ2VudEhlaWdodCxcbiAgICAgICAgICAgICAgICAgIG1heEFjY2VsZXJhdGlvbjogMC41LFxuICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDEuMCxcbiAgICAgICAgICAgICAgICAgIHVwZGF0ZUZsYWdzOiAwLCAvLyAmJiByZWNhc3QuQ1JPV0RfT0JTVEFDTEVfQVZPSURBTkNFLCAvLyAmIHJlY2FzdC5DUk9XRF9BTlRJQ0lQQVRFX1RVUk5TICYgcmVjYXN0LkNST1dEX09QVElNSVpFX1RPUE8gJiByZWNhc3QuQ1JPV0RfU0VQQVJBVElPTixcbiAgICAgICAgICAgICAgICAgIHNlcGFyYXRpb25XZWlnaHQ6IDIwLjBcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICB2YXIgYWdlbnRHZW9tZXRyeSA9IG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KGFnZW50UmFkaXVzLCBhZ2VudFJhZGl1cywgYWdlbnRIZWlnaHQsIDE2KTtcblxuICAgIHZhciBhZ2VudCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHZhciBhZ2VudEJvZHkgPSBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgYWdlbnRHZW9tZXRyeSxcbiAgICAgICAgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICBjb2xvcjogJyNGRjAwMDAnXG4gICAgICAgIH0pXG4gICAgKTtcbiAgICBcbiAgICBhZ2VudEJvZHkucG9zaXRpb24ueSA9IDE7XG4gICAgYWdlbnQuYWRkKGFnZW50Qm9keSk7XG4gICAgXG4gICAgYWdlbnQucG9zaXRpb24ueCA9IC0yNS44ODUwO1xuICAgIGFnZW50LnBvc2l0aW9uLnkgPSAtMS42NDE2NjtcbiAgICBhZ2VudC5wb3NpdGlvbi56ID0gLTUuNDEzNTA7XG4gICAgXG4gICAgc2NlbmUuYWRkKGFnZW50KTtcbiAgICBcbiAgICByZWNhc3QudmVudC5vbigndXBkYXRlJywgZnVuY3Rpb24gKGFnZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFnZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGEgPSBhZ2VudHNbaV07XG5cbiAgICAgICAgICAgIHZhciBhbmdsZSA9IE1hdGguYXRhbjIoLSBhLnZlbG9jaXR5LnosIGEudmVsb2NpdHkueCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYWdlbnQucm90YXRpb24ueSAtIGFuZ2xlKSA+IDApIHtcbiAgICAgICAgICAgICAgICBhZ2VudC5yb3RhdGlvbi55ID0gYW5nbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFnZW50LnBvc2l0aW9uLnNldChcbiAgICAgICAgICAgICAgICBhLnBvc2l0aW9uLngsIFxuICAgICAgICAgICAgICAgIGEucG9zaXRpb24ueSwgXG4gICAgICAgICAgICAgICAgYS5wb3NpdGlvbi56XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgXG4gICAgdmFyIGRlbHRhLCBvbGRUaW1lLCBuZXdUaW1lID0gMDtcbiAgICBcbiAgICAoZnVuY3Rpb24gbG9vcCgpIHtcbiAgICBcdHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbiAgICBcdFxuICAgIFx0bmV3VGltZSA9IERhdGUubm93KCk7XG4gICAgXHRcbiAgICBcdGRlbHRhID0gbmV3VGltZSAtIG9sZFRpbWU7XG4gICAgXHRpZiAoZGVsdGEgPiAxNykge1xuICAgIFx0ICAgIGRlbHRhID0gMTc7XG4gICAgXHR9XG4gICAgXHRcbiAgICBcdG9sZFRpbWUgPSBuZXdUaW1lO1xuICAgIFx0XG4gICAgXHRyZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgXHRcbiAgICBcdHJlY2FzdC5jcm93ZFVwZGF0ZShkZWx0YSAvIDEwMCk7XG4gICAgXHRyZWNhc3QuY3Jvd2RHZXRBY3RpdmVBZ2VudHMoKTtcbiAgICB9KSgpO1xufTtcblxuY29uc3QgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuY29uc3QgbW91c2UgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG5mdW5jdGlvbiBvbk1vdXNlVXAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XG5cdG1vdXNlLnggPSAoZS5jbGllbnRYIC8gd2luZG93LmlubmVyV2lkdGgpICogMiAtIDE7XG5cdG1vdXNlLnkgPSAtKGUuY2xpZW50WSAvIHdpbmRvdy5pbm5lckhlaWdodCkgKiAyICsgMTtcblx0XG5cdGNhbWVyYS51cGRhdGVNYXRyaXhXb3JsZCgpO1xuXHRcblx0cmF5Y2FzdGVyLnNldEZyb21DYW1lcmEobW91c2UsIGNhbWVyYSk7XG5cdFxuXHRjb25zdCBpbnRlcnNlY3Rpb24gPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0KHNjZW5lLCB0cnVlKVswXTtcblx0XG5cdGlmIChpbnRlcnNlY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdFxuXHRjb25zdCBwb2ludCA9IGludGVyc2VjdGlvbi5wb2ludDtcblx0XG5cdHJlY2FzdC5jcm93ZFJlcXVlc3RNb3ZlVGFyZ2V0KGFnZW50SWQsIHBvaW50LngsIHBvaW50LnksIHBvaW50LnopO1xufTtcblx0XHRcdFx0XG4vKipcbiAqIExvYWQgYW4gLk9CSiBmaWxlXG4gKi9cbi8vIHJlY2FzdC5PQkpMb2FkZXIoJ25hdl90ZXN0Lm9iaicsIGZ1bmN0aW9uKCl7XG5cbi8vICAgICByZWNhc3QuYnVpbGRUaWxlZCgpO1xuLy8gICAgIC8vIHJlY2FzdC5sb2FkVGlsZU1lc2goJy4vbmF2bWVzaC5kaXN0LmJpbicsIHJlY2FzdC5jYihmdW5jdGlvbigpe1xuLy8gICAgIC8vcmVjYXN0LmxvYWRUaWxlQ2FjaGUoJy4vdGlsZWNhY2hlLmRpc3QuYmluJywgcmVjYXN0LmNiKGZ1bmN0aW9uKCl7XG5cbi8vICAgICByZWNhc3QuaW5pdENyb3dkKDEwMDAsIDEuMCk7XG5cbi8vICAgICByZWNhc3QudmVudC5vbigndXBkYXRlJywgZnVuY3Rpb24gKGFnZW50cykge1xuLy8gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFnZW50cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgdmFyIGFnZW50ID0gYWdlbnRzW2ldO1xuXG4vLyAgICAgICAgICAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKC0gYWdlbnQudmVsb2NpdHkueiwgYWdlbnQudmVsb2NpdHkueCk7XG4vLyAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoYWdlbnRzT2JqZWN0c1thZ2VudC5pZHhdLnJvdGF0aW9uLnkgLSBhbmdsZSkgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgYWdlbnRzT2JqZWN0c1thZ2VudC5pZHhdLnJvdGF0aW9uLnkgPSBhbmdsZTtcbi8vICAgICAgICAgICAgIH1cblxuLy8gICAgICAgICAgICAgYWdlbnRzT2JqZWN0c1thZ2VudC5pZHhdLnBvc2l0aW9uLnNldChcbi8vICAgICAgICAgICAgICAgICBhZ2VudC5wb3NpdGlvbi54LFxuLy8gICAgICAgICAgICAgICAgIGFnZW50LnBvc2l0aW9uLnksXG4vLyAgICAgICAgICAgICAgICAgYWdlbnQucG9zaXRpb24uelxuLy8gICAgICAgICAgICAgKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0pO1xuXG4vLyAgICAgLyoqXG4vLyAgICAgICogQWRkIHNvbWUgYWdlbnRzXG4vLyAgICAgICovXG4vLyAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZ2VudHNPYmplY3RzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGFnZW50cy5wdXNoKHJlY2FzdC5hZGRBZ2VudCh7XG4vLyAgICAgICAgICAgICBwb3NpdGlvbjoge1xuLy8gICAgICAgICAgICAgICAgIHg6IC0yNS44ODUwLFxuLy8gICAgICAgICAgICAgICAgIHk6IC0xLjY0MTY2LFxuLy8gICAgICAgICAgICAgICAgIHo6IC01LjQxMzUwXG4vLyAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgcmFkaXVzOiAwLjgsXG4vLyAgICAgICAgICAgICBoZWlnaHQ6IDAuNSxcbi8vICAgICAgICAgICAgIG1heEFjY2VsZXJhdGlvbjogMS4wLFxuLy8gICAgICAgICAgICAgbWF4U3BlZWQ6IDIuMCxcbi8vICAgICAgICAgICAgIHVwZGF0ZUZsYWdzOiAwLCAvLyAmJiByZWNhc3QuQ1JPV0RfT0JTVEFDTEVfQVZPSURBTkNFLCAvLyAmIHJlY2FzdC5DUk9XRF9BTlRJQ0lQQVRFX1RVUk5TICYgcmVjYXN0LkNST1dEX09QVElNSVpFX1RPUE8gJiByZWNhc3QuQ1JPV0RfU0VQQVJBVElPTixcbi8vICAgICAgICAgICAgIHNlcGFyYXRpb25XZWlnaHQ6IDIwLjBcbi8vICAgICAgICAgfSkpO1xuLy8gICAgIH1cblxuLy8gICAgIHZhciByb3V0ZXM7XG5cbi8vICAgICB2YXIgbGFzdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuLy8gICAgIHZhciBhbmltYXRlID0gZnVuY3Rpb24gYW5pbWF0ZSAodGltZSkge1xuXG4vLyAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICAgICAgcmVjYXN0LmNyb3dkVXBkYXRlKDAuMSk7XG4vLyAgICAgICAgICAgICByZWNhc3QuY3Jvd2RHZXRBY3RpdmVBZ2VudHMoKTtcbi8vICAgICAgICAgfSwgMCk7XG5cbi8vICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcblxuLy8gICAgICAgICBsYXN0ID0gdGltZTtcbi8vICAgICAgICAgcmVuZGVyKCk7XG5cbi8vICAgICAgICAgaWYgKHN0YXRzKSBzdGF0cy51cGRhdGUoKTtcbi8vICAgICB9O1xuXG4vLyAgICAgYW5pbWF0ZShuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cbi8vICAgICBzZXF1ZW5jZSA9IGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VxdWVuY2UnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuLy8gICAgICAgICByb3V0ZXMgPSAwO1xuLy8gICAgICAgICBnb0F3YXkoKTtcbi8vICAgICB9O1xuXG4vLyAgICAgdmFyIGdvQXdheSA9IGZ1bmN0aW9uKCl7XG4vLyAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWdlbnRzT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgKGZ1bmN0aW9uIChpKSB7XG4vLyAgICAgICAgICAgICAgICAgcmVjYXN0LmdldFJhbmRvbVBvaW50KHJlY2FzdC5jYihmdW5jdGlvbihwdDJ4LCBwdDJ5LCBwdDJ6KXtcbi8vICAgICAgICAgICAgICAgICAgICAgcmVjYXN0LmNyb3dkUmVxdWVzdE1vdmVUYXJnZXQoaSwgcHQyeCwgcHQyeSwgcHQyeik7XG4vLyAgICAgICAgICAgICAgICAgICAgIGlmICgrK3JvdXRlcyA8IE1BWF9IT1BTKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Lm9rKHRydWUsICdyb3V0ZSAnICsgcm91dGVzICsgJzogdG8gJyArIE1hdGgucm91bmQocHQyeCwgMikgKyAnLCcgKyBNYXRoLnJvdW5kKHB0MnksIDIpKyAnLCcgKyBNYXRoLnJvdW5kKHB0MnosIDIpKTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZ29Bd2F5LCA4MDAwICogTWF0aC5yYW5kb20oKSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VxdWVuY2UnKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRlc3QuZG9uZSgpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgfSkpO1xuLy8gICAgICAgICAgICAgfSkoaSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9O1xuXG4vLyAgICAgc2VxdWVuY2UoKTtcbi8vICAgfSkpO1xuLy8gfSk7Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUEsSUFBSSxNQUFNOztJQUVWLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7Y0FDM0MsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO0tBQy9CLE1BQU07Y0FDRyxHQUFHLE1BQU0sQ0FBQyxNQUFNOzs7SUFHMUIsSUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFOztJQUVwQyxTQUFTLElBQUksR0FBRztlQUNMLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztrQkFDOUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVMsTUFBTSxFQUFFO3VCQUNsQyxDQUFDLE1BQU0sQ0FBQzthQUNsQixDQUFDO1NBQ0wsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sRUFBSTtrQkFDUixDQUFDLFFBQVEsQ0FBQyxVQUFTLEtBQUssRUFBRTtvQkFDeEIsS0FBSyxZQUFZLEtBQUssQ0FBQyxJQUFJLEVBQUU7eUJBQ3hCLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVTs7YUFFN0MsQ0FBQzs7bUJBRUssTUFBTTtTQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUEsR0FBRyxFQUFJO21CQUNMLENB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