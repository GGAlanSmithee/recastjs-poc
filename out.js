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

    window.onload = babelHelpers.asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var renderer, scene, _ref, _ref2, object, light, directionalLight, camera, controls, agent, delta, oldTime, newTime;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        renderer = new three.WebGLRenderer({ antialias: true });

                        renderer.setSize(window.innerWidth, window.innerHeight);
                        document.body.appendChild(renderer.domElement);

                        recast.setGLContext(renderer.context);

                        scene = new three.Scene();
                        _context.next = 7;
                        return Promise.all([load(), loadNavmesh()]);

                    case 7:
                        _ref = _context.sent;
                        _ref2 = babelHelpers.slicedToArray(_ref, 1);
                        object = _ref2[0];

                        scene.add(object);

                        light = new three.AmbientLight(0x404040);

                        scene.add(light);

                        directionalLight = new three.DirectionalLight(0xffffff, 0.5);

                        directionalLight.position.set(0, 1, 0);
                        scene.add(directionalLight);

                        camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

                        camera.position.z = 50;
                        camera.position.y = 20;
                        camera.lookAt(new three.Vector3(0, 0, 0));

                        controls = new three.OrbitControls(camera, renderer.domElement);

                        controls.addEventListener('change', function () {
                            renderer.render(scene, camera);
                        });

                        recast.initCrowd(1000, 1.0);

                        agent = recast.addAgent({
                            position: {
                                x: -25.8850,
                                y: -1.64166,
                                z: -5.41350
                            },
                            radius: 1.0,
                            height: 1.0,
                            maxAcceleration: 1.0,
                            maxSpeed: 2.0,
                            updateFlags: 0, // && recast.CROWD_OBSTACLE_AVOIDANCE, // & recast.CROWD_ANTICIPATE_TURNS & recast.CROWD_OPTIMIZE_TOPO & recast.CROWD_SEPARATION,
                            separationWeight: 20.0
                        });
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
                            recast.crowdUpdate(delta / 1000);
                        })();

                    case 26:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIvaG9tZS91YnVudHUvd29ya3NwYWNlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgdGhyZWUgZnJvbSAndGhyZWUnO1xuXG52YXIgcmVjYXN0O1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICByZWNhc3QgPSByZXF1aXJlKCdyZWNhc3RqcycpO1xufSBlbHNlIHtcbiAgICByZWNhc3QgPSB3aW5kb3cucmVjYXN0O1xufVxuXG5jb25zdCBsb2FkZXIgPSBuZXcgdGhyZWUuT0JKTG9hZGVyKCk7XG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbG9hZGVyLmxvYWQoJ25hdl90ZXN0Lm9iaicsIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgICAgcmVzb2x2ZShvYmplY3QpO1xuICAgICAgICB9KTtcbiAgICB9KS50aGVuKG9iamVjdCA9PiB7XG4gICAgICAgIG9iamVjdC50cmF2ZXJzZShmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgdGhyZWUuTWVzaCkge1xuICAgICAgICAgICAgICAgIGNoaWxkLm1hdGVyaWFsLnNpZGUgPSB0aHJlZS5Eb3VibGVTaWRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkTmF2bWVzaCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICByZWNhc3QuT0JKTG9hZGVyKCduYXZfdGVzdC5vYmonLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlY2FzdC5idWlsZFRpbGVkKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbn1cblxud2luZG93Lm9ubG9hZCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbmV3IHRocmVlLldlYkdMUmVuZGVyZXIoe2FudGlhbGlhczogdHJ1ZX0pO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIHJlY2FzdC5zZXRHTENvbnRleHQocmVuZGVyZXIuY29udGV4dCk7XG5cbiAgICBjb25zdCBzY2VuZSA9IG5ldyB0aHJlZS5TY2VuZSgpO1xuICAgIGNvbnN0IFsgb2JqZWN0IF0gPSBhd2FpdCBQcm9taXNlLmFsbChbbG9hZCgpLCBsb2FkTmF2bWVzaCgpXSk7XG4gICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICBjb25zdCBsaWdodCA9IG5ldyB0aHJlZS5BbWJpZW50TGlnaHQoMHg0MDQwNDApO1xuICAgIHNjZW5lLmFkZChsaWdodCk7XG4gICAgXG4gICAgY29uc3QgZGlyZWN0aW9uYWxMaWdodCA9IG5ldyB0aHJlZS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjUpO1xuICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24uc2V0KDAsIDEsIDApO1xuICAgIHNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcbiAgICBcbiAgICBjb25zdCBjYW1lcmEgPSBuZXcgdGhyZWUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuICAgIGNhbWVyYS5wb3NpdGlvbi56ID0gNTA7XG4gICAgY2FtZXJhLnBvc2l0aW9uLnkgPSAyMDtcbiAgICBjYW1lcmEubG9va0F0KG5ldyB0aHJlZS5WZWN0b3IzKDAsIDAsIDApKTtcblxuICAgIGNvbnN0IGNvbnRyb2xzID0gbmV3IHRocmVlLk9yYml0Q29udHJvbHMoY2FtZXJhLCByZW5kZXJlci5kb21FbGVtZW50KTtcbiAgICBjb250cm9scy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpe1xuICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgfSk7XG4gICAgXG4gICAgcmVjYXN0LmluaXRDcm93ZCgxMDAwLCAxLjApO1xuXG4gICAgY29uc3QgYWdlbnQgPSByZWNhc3QuYWRkQWdlbnQoe1xuICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHg6IC0yNS44ODUwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAtMS42NDE2NixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgejogLTUuNDEzNTBcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogMS4wLFxuICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMS4wLFxuICAgICAgICAgICAgICAgICAgICAgIG1heEFjY2VsZXJhdGlvbjogMS4wLFxuICAgICAgICAgICAgICAgICAgICAgIG1heFNwZWVkOiAyLjAsXG4gICAgICAgICAgICAgICAgICAgICAgdXBkYXRlRmxhZ3M6IDAsIC8vICYmIHJlY2FzdC5DUk9XRF9PQlNUQUNMRV9BVk9JREFOQ0UsIC8vICYgcmVjYXN0LkNST1dEX0FOVElDSVBBVEVfVFVSTlMgJiByZWNhc3QuQ1JPV0RfT1BUSU1JWkVfVE9QTyAmIHJlY2FzdC5DUk9XRF9TRVBBUkFUSU9OLFxuICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRpb25XZWlnaHQ6IDIwLjBcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgdmFyIGRlbHRhLCBvbGRUaW1lLCBuZXdUaW1lID0gMDtcbiAgICBcbiAgICAoZnVuY3Rpb24gbG9vcCgpIHtcbiAgICBcdHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbiAgICBcdFxuICAgIFx0bmV3VGltZSA9IERhdGUubm93KCk7XG4gICAgXHRcbiAgICBcdGRlbHRhID0gbmV3VGltZSAtIG9sZFRpbWU7XG4gICAgXHRpZiAoZGVsdGEgPiAxNykge1xuICAgIFx0ICAgIGRlbHRhID0gMTc7XG4gICAgXHR9XG4gICAgXHRcbiAgICBcdG9sZFRpbWUgPSBuZXdUaW1lO1xuICAgIFx0XG4gICAgXHRyZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgXHRyZWNhc3QuY3Jvd2RVcGRhdGUoZGVsdGEgLyAxMDAwKTtcbiAgICB9KSgpO1xufTtcblxuLyoqXG4gKiBMb2FkIGFuIC5PQkogZmlsZVxuICovXG4vLyByZWNhc3QuT0JKTG9hZGVyKCduYXZfdGVzdC5vYmonLCBmdW5jdGlvbigpe1xuXG4vLyAgICAgcmVjYXN0LmJ1aWxkVGlsZWQoKTtcbi8vICAgICAvLyByZWNhc3QubG9hZFRpbGVNZXNoKCcuL25hdm1lc2guZGlzdC5iaW4nLCByZWNhc3QuY2IoZnVuY3Rpb24oKXtcbi8vICAgICAvL3JlY2FzdC5sb2FkVGlsZUNhY2hlKCcuL3RpbGVjYWNoZS5kaXN0LmJpbicsIHJlY2FzdC5jYihmdW5jdGlvbigpe1xuXG4vLyAgICAgcmVjYXN0LmluaXRDcm93ZCgxMDAwLCAxLjApO1xuXG4vLyAgICAgcmVjYXN0LnZlbnQub24oJ3VwZGF0ZScsIGZ1bmN0aW9uIChhZ2VudHMpIHtcbi8vICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZ2VudHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgICAgIHZhciBhZ2VudCA9IGFnZW50c1tpXTtcblxuLy8gICAgICAgICAgICAgdmFyIGFuZ2xlID0gTWF0aC5hdGFuMigtIGFnZW50LnZlbG9jaXR5LnosIGFnZW50LnZlbG9jaXR5LngpO1xuLy8gICAgICAgICAgICAgaWYgKE1hdGguYWJzKGFnZW50c09iamVjdHNbYWdlbnQuaWR4XS5yb3RhdGlvbi55IC0gYW5nbGUpID4gMCkge1xuLy8gICAgICAgICAgICAgICAgIGFnZW50c09iamVjdHNbYWdlbnQuaWR4XS5yb3RhdGlvbi55ID0gYW5nbGU7XG4vLyAgICAgICAgICAgICB9XG5cbi8vICAgICAgICAgICAgIGFnZW50c09iamVjdHNbYWdlbnQuaWR4XS5wb3NpdGlvbi5zZXQoXG4vLyAgICAgICAgICAgICAgICAgYWdlbnQucG9zaXRpb24ueCxcbi8vICAgICAgICAgICAgICAgICBhZ2VudC5wb3NpdGlvbi55LFxuLy8gICAgICAgICAgICAgICAgIGFnZW50LnBvc2l0aW9uLnpcbi8vICAgICAgICAgICAgICk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9KTtcblxuLy8gICAgIC8qKlxuLy8gICAgICAqIEFkZCBzb21lIGFnZW50c1xuLy8gICAgICAqL1xuLy8gICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWdlbnRzT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICBhZ2VudHMucHVzaChyZWNhc3QuYWRkQWdlbnQoe1xuLy8gICAgICAgICAgICAgcG9zaXRpb246IHtcbi8vICAgICAgICAgICAgICAgICB4OiAtMjUuODg1MCxcbi8vICAgICAgICAgICAgICAgICB5OiAtMS42NDE2Nixcbi8vICAgICAgICAgICAgICAgICB6OiAtNS40MTM1MFxuLy8gICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgIHJhZGl1czogMC44LFxuLy8gICAgICAgICAgICAgaGVpZ2h0OiAwLjUsXG4vLyAgICAgICAgICAgICBtYXhBY2NlbGVyYXRpb246IDEuMCxcbi8vICAgICAgICAgICAgIG1heFNwZWVkOiAyLjAsXG4vLyAgICAgICAgICAgICB1cGRhdGVGbGFnczogMCwgLy8gJiYgcmVjYXN0LkNST1dEX09CU1RBQ0xFX0FWT0lEQU5DRSwgLy8gJiByZWNhc3QuQ1JPV0RfQU5USUNJUEFURV9UVVJOUyAmIHJlY2FzdC5DUk9XRF9PUFRJTUlaRV9UT1BPICYgcmVjYXN0LkNST1dEX1NFUEFSQVRJT04sXG4vLyAgICAgICAgICAgICBzZXBhcmF0aW9uV2VpZ2h0OiAyMC4wXG4vLyAgICAgICAgIH0pKTtcbi8vICAgICB9XG5cbi8vICAgICB2YXIgcm91dGVzO1xuXG4vLyAgICAgdmFyIGxhc3QgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbi8vICAgICB2YXIgYW5pbWF0ZSA9IGZ1bmN0aW9uIGFuaW1hdGUgKHRpbWUpIHtcblxuLy8gICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgIHJlY2FzdC5jcm93ZFVwZGF0ZSgwLjEpO1xuLy8gICAgICAgICAgICAgcmVjYXN0LmNyb3dkR2V0QWN0aXZlQWdlbnRzKCk7XG4vLyAgICAgICAgIH0sIDApO1xuXG4vLyAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG5cbi8vICAgICAgICAgbGFzdCA9IHRpbWU7XG4vLyAgICAgICAgIHJlbmRlcigpO1xuXG4vLyAgICAgICAgIGlmIChzdGF0cykgc3RhdHMudXBkYXRlKCk7XG4vLyAgICAgfTtcblxuLy8gICAgIGFuaW1hdGUobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuXG4vLyAgICAgc2VxdWVuY2UgPSBmdW5jdGlvbigpIHtcbi8vICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlcXVlbmNlJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbi8vICAgICAgICAgcm91dGVzID0gMDtcbi8vICAgICAgICAgZ29Bd2F5KCk7XG4vLyAgICAgfTtcblxuLy8gICAgIHZhciBnb0F3YXkgPSBmdW5jdGlvbigpe1xuLy8gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFnZW50c09iamVjdHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgICAgIChmdW5jdGlvbiAoaSkge1xuLy8gICAgICAgICAgICAgICAgIHJlY2FzdC5nZXRSYW5kb21Qb2ludChyZWNhc3QuY2IoZnVuY3Rpb24ocHQyeCwgcHQyeSwgcHQyeil7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJlY2FzdC5jcm93ZFJlcXVlc3RNb3ZlVGFyZ2V0KGksIHB0MngsIHB0MnksIHB0MnopO1xuLy8gICAgICAgICAgICAgICAgICAgICBpZiAoKytyb3V0ZXMgPCBNQVhfSE9QUykge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGVzdC5vayh0cnVlLCAncm91dGUgJyArIHJvdXRlcyArICc6IHRvICcgKyBNYXRoLnJvdW5kKHB0MngsIDIpICsgJywnICsgTWF0aC5yb3VuZChwdDJ5LCAyKSsgJywnICsgTWF0aC5yb3VuZChwdDJ6LCAyKSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGdvQXdheSwgODAwMCAqIE1hdGgucmFuZG9tKCkpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlcXVlbmNlJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXN0LmRvbmUoKTtcbi8vICAgICAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIH0pKTtcbi8vICAgICAgICAgICAgIH0pKGkpO1xuLy8gICAgICAgICB9XG4vLyAgICAgfTtcblxuLy8gICAgIHNlcXVlbmNlKCk7XG4vLyAgIH0pKTtcbi8vIH0pOyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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