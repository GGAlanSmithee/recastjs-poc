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
    var MaxAgents = 50;
    var agentBodies = new Map();

    window.onload = babelHelpers.asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var renderer, agentRadius, agentHeight, cellSize, cellHeight, agentMaxClimb, _ref, _ref2, object, light, directionalLight, controls, i, agentId, agentGeometry, agentBody, agent, delta, oldTime, newTime;

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

                        for (i = 0; i < MaxAgents; ++i) {
                            agentId = recast.addAgent({
                                position: {
                                    x: -25,
                                    y: -1,
                                    z: -5
                                },
                                radius: agentRadius,
                                height: agentHeight,
                                maxAcceleration: 0.5,
                                maxSpeed: 1.0,
                                updateFlags: 0, // recast.CROWD_OBSTACLE_AVOIDANCE & recast.CROWD_ANTICIPATE_TURNS & recast.CROWD_OPTIMIZE_TOPO & recast.CROWD_SEPARATION,
                                separationWeight: 20.0
                            });
                            agentGeometry = new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight, 16);
                            agentBody = new THREE.Mesh(agentGeometry, new THREE.MeshBasicMaterial({ color: '#FF0000' }));

                            agentBody.position.y = 1;

                            agent = new THREE.Object3D();

                            agent.add(agentBody);

                            agentBodies.set(agentId, agent);
                            scene.add(agent);
                        }

                        recast.vent.on('update', function (agents) {
                            for (var i = 0; i < agents.length; i++) {
                                var a = agents[i];

                                var agent = agentBodies.get(a.idx);

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

                    case 33:
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

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = agentBodies.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var agentId = _step.value;

                recast.crowdRequestMoveTarget(agentId, point.x, point.y, point.z);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
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

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi8vaG9tZS91YnVudHUvd29ya3NwYWNlL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHRocmVlIGZyb20gJ3RocmVlJztcblxudmFyIHJlY2FzdDtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgcmVjYXN0ID0gcmVxdWlyZSgncmVjYXN0anMnKTtcbn0gZWxzZSB7XG4gICAgcmVjYXN0ID0gd2luZG93LnJlY2FzdDtcbn1cblxuY29uc3QgbG9hZGVyID0gbmV3IHRocmVlLk9CSkxvYWRlcigpO1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxvYWRlci5sb2FkKCduYXZfdGVzdC5vYmonLCBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICAgIHJlc29sdmUob2JqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfSkudGhlbihvYmplY3QgPT4ge1xuICAgICAgICBvYmplY3QudHJhdmVyc2UoZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIHRocmVlLk1lc2gpIHtcbiAgICAgICAgICAgICAgICBjaGlsZC5tYXRlcmlhbC5zaWRlID0gdGhyZWUuRG91YmxlU2lkZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gbG9hZE5hdm1lc2goKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgcmVjYXN0Lk9CSkxvYWRlcignbmF2X3Rlc3Qub2JqJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWNhc3QuYnVpbGRUaWxlZCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG59XG5cbnZhciBzY2VuZTtcbnZhciBjYW1lcmE7XG52YXIgTWF4QWdlbnRzID0gNTA7XG52YXIgYWdlbnRCb2RpZXMgPSBuZXcgTWFwKCk7XG5cbndpbmRvdy5vbmxvYWQgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IG5ldyB0aHJlZS5XZWJHTFJlbmRlcmVyKHthbnRpYWxpYXM6IHRydWV9KTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG4gICAgXG4gICAgY29uc3QgYWdlbnRSYWRpdXMgPSAwLjU7XG4gICAgY29uc3QgYWdlbnRIZWlnaHQgPSA0LjA7XG4gICAgY29uc3QgY2VsbFNpemUgPSBhZ2VudFJhZGl1cyAvIDI7XG4gICAgY29uc3QgY2VsbEhlaWdodCA9IGNlbGxTaXplIC8gMjtcbiAgICBjb25zdCBhZ2VudE1heENsaW1iID0gTWF0aC5jZWlsKGFnZW50SGVpZ2h0LzIpO1xuICAgIFxuICAgIHJlY2FzdC5zZXR0aW5ncyh7XG4gICAgICAgIGNlbGxTaXplOiBjZWxsU2l6ZSxcbiAgICAgICAgY2VsbEhlaWdodDogY2VsbEhlaWdodCxcbiAgICAgICAgYWdlbnRIZWlnaHQ6IGFnZW50SGVpZ2h0LFxuICAgICAgICBhZ2VudFJhZGl1czogYWdlbnRSYWRpdXMsXG4gICAgICAgIGFnZW50TWF4Q2xpbWI6IGFnZW50TWF4Q2xpbWIsXG4gICAgICAgIGFnZW50TWF4U2xvcGU6IDMwLjBcbiAgICB9KTtcblxuICAgIHJlY2FzdC5zZXRHTENvbnRleHQocmVuZGVyZXIuY29udGV4dCk7XG5cbiAgICBzY2VuZSA9IG5ldyB0aHJlZS5TY2VuZSgpO1xuICAgIGNvbnN0IFsgb2JqZWN0IF0gPSBhd2FpdCBQcm9taXNlLmFsbChbbG9hZCgpLCBsb2FkTmF2bWVzaCgpXSk7XG4gICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICByZWNhc3QuaW5pdENyb3dkKDEwMDAsIDEuMCk7XG5cbiAgICBjb25zdCBsaWdodCA9IG5ldyB0aHJlZS5BbWJpZW50TGlnaHQoMHg0MDQwNDApO1xuICAgIHNjZW5lLmFkZChsaWdodCk7XG4gICAgXG4gICAgY29uc3QgZGlyZWN0aW9uYWxMaWdodCA9IG5ldyB0aHJlZS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjUpO1xuICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24uc2V0KDAsIDEsIDApO1xuICAgIHNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcbiAgICBcbiAgICBjYW1lcmEgPSBuZXcgdGhyZWUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuICAgIGNhbWVyYS5wb3NpdGlvbi55ID0gNTA7XG4gICAgY2FtZXJhLmxvb2tBdChuZXcgdGhyZWUuVmVjdG9yMygwLCAwLCAwKSk7XG5cbiAgICBjb25zdCBjb250cm9scyA9IG5ldyB0aHJlZS5PcmJpdENvbnRyb2xzKGNhbWVyYSwgcmVuZGVyZXIuZG9tRWxlbWVudCk7XG4gICAgY29udHJvbHMuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXhBZ2VudHM7ICsraSkge1xuICAgICAgICB2YXIgYWdlbnRJZCA9IHJlY2FzdC5hZGRBZ2VudCh7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeDogLTI1LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgejogLTVcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogYWdlbnRSYWRpdXMsXG4gICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhZ2VudEhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICBtYXhBY2NlbGVyYXRpb246IDAuNSxcbiAgICAgICAgICAgICAgICAgICAgICBtYXhTcGVlZDogMS4wLFxuICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUZsYWdzOiAwLC8vIHJlY2FzdC5DUk9XRF9PQlNUQUNMRV9BVk9JREFOQ0UgJiByZWNhc3QuQ1JPV0RfQU5USUNJUEFURV9UVVJOUyAmIHJlY2FzdC5DUk9XRF9PUFRJTUlaRV9UT1BPICYgcmVjYXN0LkNST1dEX1NFUEFSQVRJT04sXG4gICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdGlvbldlaWdodDogMjAuMFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgIGxldCBhZ2VudEdlb21ldHJ5ID0gbmV3IFRIUkVFLkN5bGluZGVyR2VvbWV0cnkoYWdlbnRSYWRpdXMsIGFnZW50UmFkaXVzLCBhZ2VudEhlaWdodCwgMTYpO1xuICAgICAgICBsZXQgYWdlbnRCb2R5ID0gbmV3IFRIUkVFLk1lc2goYWdlbnRHZW9tZXRyeSwgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHsgY29sb3I6ICcjRkYwMDAwJyB9KSk7XG4gICAgICAgIGFnZW50Qm9keS5wb3NpdGlvbi55ID0gMTtcbiAgICAgICAgXG4gICAgICAgIGxldCBhZ2VudCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgICAgICBhZ2VudC5hZGQoYWdlbnRCb2R5KTtcbiAgICAgICAgXG4gICAgICAgIGFnZW50Qm9kaWVzLnNldChhZ2VudElkLCBhZ2VudCk7XG4gICAgICAgIHNjZW5lLmFkZChhZ2VudCk7XG4gICAgfVxuICAgIFxuICAgIHJlY2FzdC52ZW50Lm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoYWdlbnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWdlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYSA9IGFnZW50c1tpXTtcblxuICAgICAgICAgICAgbGV0IGFnZW50ID0gYWdlbnRCb2RpZXMuZ2V0KGEuaWR4KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IGFuZ2xlID0gTWF0aC5hdGFuMigtIGEudmVsb2NpdHkueiwgYS52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGFnZW50LnJvdGF0aW9uLnkgLSBhbmdsZSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgYWdlbnQucm90YXRpb24ueSA9IGFuZ2xlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhZ2VudC5wb3NpdGlvbi5zZXQoYS5wb3NpdGlvbi54LCBhLnBvc2l0aW9uLnksIGEucG9zaXRpb24ueik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICBcbiAgICB2YXIgZGVsdGEsIG9sZFRpbWUsIG5ld1RpbWUgPSAwO1xuICAgIFxuICAgIChmdW5jdGlvbiBsb29wKCkge1xuICAgIFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xuICAgIFx0XG4gICAgXHRuZXdUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcdFxuICAgIFx0ZGVsdGEgPSBuZXdUaW1lIC0gb2xkVGltZTtcbiAgICBcdGlmIChkZWx0YSA+IDE3KSB7XG4gICAgXHQgICAgZGVsdGEgPSAxNztcbiAgICBcdH1cbiAgICBcdFxuICAgIFx0b2xkVGltZSA9IG5ld1RpbWU7XG4gICAgXHRcbiAgICBcdHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICBcdFxuICAgIFx0cmVjYXN0LmNyb3dkVXBkYXRlKGRlbHRhIC8gMTAwKTtcbiAgICBcdHJlY2FzdC5jcm93ZEdldEFjdGl2ZUFnZW50cygpO1xuICAgIH0pKCk7XG59O1xuXG5jb25zdCByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XG5jb25zdCBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbmZ1bmN0aW9uIG9uTW91c2VVcChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcblx0bW91c2UueCA9IChlLmNsaWVudFggLyB3aW5kb3cuaW5uZXJXaWR0aCkgKiAyIC0gMTtcblx0bW91c2UueSA9IC0oZS5jbGllbnRZIC8gd2luZG93LmlubmVySGVpZ2h0KSAqIDIgKyAxO1xuXHRcblx0Y2FtZXJhLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cdFxuXHRyYXljYXN0ZXIuc2V0RnJvbUNhbWVyYShtb3VzZSwgY2FtZXJhKTtcblx0XG5cdGNvbnN0IGludGVyc2VjdGlvbiA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3Qoc2NlbmUsIHRydWUpWzBdO1xuXHRcblx0aWYgKGludGVyc2VjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0XG5cdGNvbnN0IHBvaW50ID0gaW50ZXJzZWN0aW9uLnBvaW50O1xuXHRcblx0Zm9yIChsZXQgYWdlbnRJZCBvZiBhZ2VudEJvZGllcy5rZXlzKCkpIHtcblx0ICAgIHJlY2FzdC5jcm93ZFJlcXVlc3RNb3ZlVGFyZ2V0KGFnZW50SWQsIHBvaW50LngsIHBvaW50LnksIHBvaW50LnopO1xuXHR9XG59O1xuXHRcdFx0XHRcbi8qKlxuICogTG9hZCBhbiAuT0JKIGZpbGVcbiAqL1xuLy8gcmVjYXN0Lk9CSkxvYWRlcignbmF2X3Rlc3Qub2JqJywgZnVuY3Rpb24oKXtcblxuLy8gICAgIHJlY2FzdC5idWlsZFRpbGVkKCk7XG4vLyAgICAgLy8gcmVjYXN0LmxvYWRUaWxlTWVzaCgnLi9uYXZtZXNoLmRpc3QuYmluJywgcmVjYXN0LmNiKGZ1bmN0aW9uKCl7XG4vLyAgICAgLy9yZWNhc3QubG9hZFRpbGVDYWNoZSgnLi90aWxlY2FjaGUuZGlzdC5iaW4nLCByZWNhc3QuY2IoZnVuY3Rpb24oKXtcblxuLy8gICAgIHJlY2FzdC5pbml0Q3Jvd2QoMTAwMCwgMS4wKTtcblxuLy8gICAgIHJlY2FzdC52ZW50Lm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoYWdlbnRzKSB7XG4vLyAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWdlbnRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgICAgICB2YXIgYWdlbnQgPSBhZ2VudHNbaV07XG5cbi8vICAgICAgICAgICAgIHZhciBhbmdsZSA9IE1hdGguYXRhbjIoLSBhZ2VudC52ZWxvY2l0eS56LCBhZ2VudC52ZWxvY2l0eS54KTtcbi8vICAgICAgICAgICAgIGlmIChNYXRoLmFicyhhZ2VudHNPYmplY3RzW2FnZW50LmlkeF0ucm90YXRpb24ueSAtIGFuZ2xlKSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICBhZ2VudHNPYmplY3RzW2FnZW50LmlkeF0ucm90YXRpb24ueSA9IGFuZ2xlO1xuLy8gICAgICAgICAgICAgfVxuXG4vLyAgICAgICAgICAgICBhZ2VudHNPYmplY3RzW2FnZW50LmlkeF0ucG9zaXRpb24uc2V0KFxuLy8gICAgICAgICAgICAgICAgIGFnZW50LnBvc2l0aW9uLngsXG4vLyAgICAgICAgICAgICAgICAgYWdlbnQucG9zaXRpb24ueSxcbi8vICAgICAgICAgICAgICAgICBhZ2VudC5wb3NpdGlvbi56XG4vLyAgICAgICAgICAgICApO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSk7XG5cbi8vICAgICAvKipcbi8vICAgICAgKiBBZGQgc29tZSBhZ2VudHNcbi8vICAgICAgKi9cbi8vICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFnZW50c09iamVjdHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgYWdlbnRzLnB1c2gocmVjYXN0LmFkZEFnZW50KHtcbi8vICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4vLyAgICAgICAgICAgICAgICAgeDogLTI1Ljg4NTAsXG4vLyAgICAgICAgICAgICAgICAgeTogLTEuNjQxNjYsXG4vLyAgICAgICAgICAgICAgICAgejogLTUuNDEzNTBcbi8vICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICByYWRpdXM6IDAuOCxcbi8vICAgICAgICAgICAgIGhlaWdodDogMC41LFxuLy8gICAgICAgICAgICAgbWF4QWNjZWxlcmF0aW9uOiAxLjAsXG4vLyAgICAgICAgICAgICBtYXhTcGVlZDogMi4wLFxuLy8gICAgICAgICAgICAgdXBkYXRlRmxhZ3M6IDAsIC8vICYmIHJlY2FzdC5DUk9XRF9PQlNUQUNMRV9BVk9JREFOQ0UsIC8vICYgcmVjYXN0LkNST1dEX0FOVElDSVBBVEVfVFVSTlMgJiByZWNhc3QuQ1JPV0RfT1BUSU1JWkVfVE9QTyAmIHJlY2FzdC5DUk9XRF9TRVBBUkFUSU9OLFxuLy8gICAgICAgICAgICAgc2VwYXJhdGlvbldlaWdodDogMjAuMFxuLy8gICAgICAgICB9KSk7XG4vLyAgICAgfVxuXG4vLyAgICAgdmFyIHJvdXRlcztcblxuLy8gICAgIHZhciBsYXN0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4vLyAgICAgdmFyIGFuaW1hdGUgPSBmdW5jdGlvbiBhbmltYXRlICh0aW1lKSB7XG5cbi8vICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgICByZWNhc3QuY3Jvd2RVcGRhdGUoMC4xKTtcbi8vICAgICAgICAgICAgIHJlY2FzdC5jcm93ZEdldEFjdGl2ZUFnZW50cygpO1xuLy8gICAgICAgICB9LCAwKTtcblxuLy8gICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuXG4vLyAgICAgICAgIGxhc3QgPSB0aW1lO1xuLy8gICAgICAgICByZW5kZXIoKTtcblxuLy8gICAgICAgICBpZiAoc3RhdHMpIHN0YXRzLnVwZGF0ZSgpO1xuLy8gICAgIH07XG5cbi8vICAgICBhbmltYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcblxuLy8gICAgIHNlcXVlbmNlID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXF1ZW5jZScpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4vLyAgICAgICAgIHJvdXRlcyA9IDA7XG4vLyAgICAgICAgIGdvQXdheSgpO1xuLy8gICAgIH07XG5cbi8vICAgICB2YXIgZ29Bd2F5ID0gZnVuY3Rpb24oKXtcbi8vICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZ2VudHNPYmplY3RzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgICAgICAoZnVuY3Rpb24gKGkpIHtcbi8vICAgICAgICAgICAgICAgICByZWNhc3QuZ2V0UmFuZG9tUG9pbnQocmVjYXN0LmNiKGZ1bmN0aW9uKHB0MngsIHB0MnksIHB0Mnope1xuLy8gICAgICAgICAgICAgICAgICAgICByZWNhc3QuY3Jvd2RSZXF1ZXN0TW92ZVRhcmdldChpLCBwdDJ4LCBwdDJ5LCBwdDJ6KTtcbi8vICAgICAgICAgICAgICAgICAgICAgaWYgKCsrcm91dGVzIDwgTUFYX0hPUFMpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3Qub2sodHJ1ZSwgJ3JvdXRlICcgKyByb3V0ZXMgKyAnOiB0byAnICsgTWF0aC5yb3VuZChwdDJ4LCAyKSArICcsJyArIE1hdGgucm91bmQocHQyeSwgMikrICcsJyArIE1hdGgucm91bmQocHQyeiwgMikpO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChnb0F3YXksIDgwMDAgKiBNYXRoLnJhbmRvbSgpKTtcbi8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXF1ZW5jZScpLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGVzdC5kb25lKCk7XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICB9KSk7XG4vLyAgICAgICAgICAgICB9KShpKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH07XG5cbi8vICAgICBzZXF1ZW5jZSgpO1xuLy8gICB9KSk7XG4vLyB9KTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJQSxJQUFJLE1BQU07O0lBRVYsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtjQUMzQyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7S0FDL0IsTUFBTTtjQUNHLEdBQUcsTUFBTSxDQUFDLE1BQU07OztJQUcxQixJQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUU7O0lBRXBDLFNBQVMsSUFBSSxHQUFHO2VBQ0wsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO2tCQUM5QixDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBUyxNQUFNLEVBQUU7dUJBQ2xDLENBQUMsTUFBTSxDQUFDO2FBQ2xCLENBQUM7U0FDTCxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsTUFBTSxFQUFJO2tCQUNSLENBQUMsUUFBUSxDQUFDLFVBQVMsS0FBSyxFQUFFO29CQUN4QixLQUFLLFlBQVksS0FBSyxDQUFDLElBQUksRUFBRTt5QkFDeEIsQ0FBQyxRQUFR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