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

    window.onload = babelHelpers.asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var renderer, _ref, _ref2, object, light, directionalLight, controls, agentId, agentGeometry, agent, agentBody, delta, oldTime, newTime;

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

                        agentId = recast.addAgent({
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
                        agentGeometry = new THREE.CylinderGeometry(0.2, 0.5, 2);
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
                            recast.crowdUpdate(delta / 1000);
                        })();

                    case 36:
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

        var klickedObject = raycaster.intersectObject(scene, true)[0];

        console.log(klickedObject);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIvaG9tZS91YnVudHUvd29ya3NwYWNlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgdGhyZWUgZnJvbSAndGhyZWUnO1xuXG52YXIgcmVjYXN0O1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICByZWNhc3QgPSByZXF1aXJlKCdyZWNhc3RqcycpO1xufSBlbHNlIHtcbiAgICByZWNhc3QgPSB3aW5kb3cucmVjYXN0O1xufVxuXG5jb25zdCBsb2FkZXIgPSBuZXcgdGhyZWUuT0JKTG9hZGVyKCk7XG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbG9hZGVyLmxvYWQoJ25hdl90ZXN0Lm9iaicsIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICAgICAgcmVzb2x2ZShvYmplY3QpO1xuICAgICAgICB9KTtcbiAgICB9KS50aGVuKG9iamVjdCA9PiB7XG4gICAgICAgIG9iamVjdC50cmF2ZXJzZShmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgdGhyZWUuTWVzaCkge1xuICAgICAgICAgICAgICAgIGNoaWxkLm1hdGVyaWFsLnNpZGUgPSB0aHJlZS5Eb3VibGVTaWRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkTmF2bWVzaCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICByZWNhc3QuT0JKTG9hZGVyKCduYXZfdGVzdC5vYmonLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlY2FzdC5idWlsZFRpbGVkKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbn1cblxudmFyIHNjZW5lO1xudmFyIGNhbWVyYTtcblxud2luZG93Lm9ubG9hZCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbmV3IHRocmVlLldlYkdMUmVuZGVyZXIoe2FudGlhbGlhczogdHJ1ZX0pO1xuICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgIHJlY2FzdC5zZXRHTENvbnRleHQocmVuZGVyZXIuY29udGV4dCk7XG5cbiAgICBzY2VuZSA9IG5ldyB0aHJlZS5TY2VuZSgpO1xuICAgIGNvbnN0IFsgb2JqZWN0IF0gPSBhd2FpdCBQcm9taXNlLmFsbChbbG9hZCgpLCBsb2FkTmF2bWVzaCgpXSk7XG4gICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICBjb25zdCBsaWdodCA9IG5ldyB0aHJlZS5BbWJpZW50TGlnaHQoMHg0MDQwNDApO1xuICAgIHNjZW5lLmFkZChsaWdodCk7XG4gICAgXG4gICAgY29uc3QgZGlyZWN0aW9uYWxMaWdodCA9IG5ldyB0aHJlZS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAwLjUpO1xuICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24uc2V0KDAsIDEsIDApO1xuICAgIHNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcbiAgICBcbiAgICBjYW1lcmEgPSBuZXcgdGhyZWUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApO1xuICAgIGNhbWVyYS5wb3NpdGlvbi56ID0gNTA7XG4gICAgY2FtZXJhLnBvc2l0aW9uLnkgPSAyMDtcbiAgICBjYW1lcmEubG9va0F0KG5ldyB0aHJlZS5WZWN0b3IzKDAsIDAsIDApKTtcblxuICAgIGNvbnN0IGNvbnRyb2xzID0gbmV3IHRocmVlLk9yYml0Q29udHJvbHMoY2FtZXJhLCByZW5kZXJlci5kb21FbGVtZW50KTtcbiAgICBjb250cm9scy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpe1xuICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgfSk7XG4gICAgXG4gICAgcmVjYXN0LmluaXRDcm93ZCgxMDAwLCAxLjApO1xuXG4gICAgY29uc3QgYWdlbnRJZCA9IHJlY2FzdC5hZGRBZ2VudCh7XG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeDogLTI1Ljg4NTAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHk6IC0xLjY0MTY2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB6OiAtNS40MTM1MFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiAxLjAsXG4gICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxLjAsXG4gICAgICAgICAgICAgICAgICAgICAgbWF4QWNjZWxlcmF0aW9uOiAxLjAsXG4gICAgICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDIuMCxcbiAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVGbGFnczogMCwgLy8gJiYgcmVjYXN0LkNST1dEX09CU1RBQ0xFX0FWT0lEQU5DRSwgLy8gJiByZWNhc3QuQ1JPV0RfQU5USUNJUEFURV9UVVJOUyAmIHJlY2FzdC5DUk9XRF9PUFRJTUlaRV9UT1BPICYgcmVjYXN0LkNST1dEX1NFUEFSQVRJT04sXG4gICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdGlvbldlaWdodDogMjAuMFxuICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICB2YXIgYWdlbnRHZW9tZXRyeSA9IG5ldyBUSFJFRS5DeWxpbmRlckdlb21ldHJ5KDAuMiwgMC41LCAyKTtcblxuICAgIHZhciBhZ2VudCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHZhciBhZ2VudEJvZHkgPSBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgYWdlbnRHZW9tZXRyeSxcbiAgICAgICAgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICBjb2xvcjogJyNGRjAwMDAnXG4gICAgICAgIH0pXG4gICAgKTtcbiAgICBcbiAgICBhZ2VudEJvZHkucG9zaXRpb24ueSA9IDE7XG4gICAgYWdlbnQuYWRkKGFnZW50Qm9keSk7XG4gICAgXG4gICAgYWdlbnQucG9zaXRpb24ueCA9IC0yNS44ODUwO1xuICAgIGFnZW50LnBvc2l0aW9uLnkgPSAtMS42NDE2NjtcbiAgICBhZ2VudC5wb3NpdGlvbi56ID0gLTUuNDEzNTA7XG4gICAgXG4gICAgc2NlbmUuYWRkKGFnZW50KTtcbiAgICBcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICBcbiAgICB2YXIgZGVsdGEsIG9sZFRpbWUsIG5ld1RpbWUgPSAwO1xuICAgIFxuICAgIChmdW5jdGlvbiBsb29wKCkge1xuICAgIFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xuICAgIFx0XG4gICAgXHRuZXdUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcdFxuICAgIFx0ZGVsdGEgPSBuZXdUaW1lIC0gb2xkVGltZTtcbiAgICBcdGlmIChkZWx0YSA+IDE3KSB7XG4gICAgXHQgICAgZGVsdGEgPSAxNztcbiAgICBcdH1cbiAgICBcdFxuICAgIFx0b2xkVGltZSA9IG5ld1RpbWU7XG4gICAgXHRcbiAgICBcdHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICBcdHJlY2FzdC5jcm93ZFVwZGF0ZShkZWx0YSAvIDEwMDApO1xuICAgIH0pKCk7XG59O1xuXG5jb25zdCByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKCk7XG5jb25zdCBtb3VzZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbmZ1bmN0aW9uIG9uTW91c2VVcChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcblx0bW91c2UueCA9IChlLmNsaWVudFggLyB3aW5kb3cuaW5uZXJXaWR0aCkgKiAyIC0gMTtcblx0bW91c2UueSA9IC0oZS5jbGllbnRZIC8gd2luZG93LmlubmVySGVpZ2h0KSAqIDIgKyAxO1xuXHRcblx0Y2FtZXJhLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cdFxuXHRyYXljYXN0ZXIuc2V0RnJvbUNhbWVyYShtb3VzZSwgY2FtZXJhKTtcblx0XG5cdGNvbnN0IGtsaWNrZWRPYmplY3QgPSByYXljYXN0ZXIuaW50ZXJzZWN0T2JqZWN0KHNjZW5lLCB0cnVlKVswXTtcblx0XG5cdGNvbnNvbGUubG9nKGtsaWNrZWRPYmplY3QpO1xufTtcblx0XHRcdFx0XG4vKipcbiAqIExvYWQgYW4gLk9CSiBmaWxlXG4gKi9cbi8vIHJlY2FzdC5PQkpMb2FkZXIoJ25hdl90ZXN0Lm9iaicsIGZ1bmN0aW9uKCl7XG5cbi8vICAgICByZWNhc3QuYnVpbGRUaWxlZCgpO1xuLy8gICAgIC8vIHJlY2FzdC5sb2FkVGlsZU1lc2goJy4vbmF2bWVzaC5kaXN0LmJpbicsIHJlY2FzdC5jYihmdW5jdGlvbigpe1xuLy8gICAgIC8vcmVjYXN0LmxvYWRUaWxlQ2FjaGUoJy4vdGlsZWNhY2hlLmRpc3QuYmluJywgcmVjYXN0LmNiKGZ1bmN0aW9uKCl7XG5cbi8vICAgICByZWNhc3QuaW5pdENyb3dkKDEwMDAsIDEuMCk7XG5cbi8vICAgICByZWNhc3QudmVudC5vbigndXBkYXRlJywgZnVuY3Rpb24gKGFnZW50cykge1xuLy8gICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFnZW50cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgdmFyIGFnZW50ID0gYWdlbnRzW2ldO1xuXG4vLyAgICAgICAgICAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKC0gYWdlbnQudmVsb2NpdHkueiwgYWdlbnQudmVsb2NpdHkueCk7XG4vLyAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoYWdlbnRzT2JqZWN0c1thZ2VudC5pZHhdLnJvdGF0aW9uLnkgLSBhbmdsZSkgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgYWdlbnRzT2JqZWN0c1thZ2VudC5pZHhdLnJvdGF0aW9uLnkgPSBhbmdsZTtcbi8vICAgICAgICAgICAgIH1cblxuLy8gICAgICAgICAgICAgYWdlbnRzT2JqZWN0c1thZ2VudC5pZHhdLnBvc2l0aW9uLnNldChcbi8vICAgICAgICAgICAgICAgICBhZ2VudC5wb3NpdGlvbi54LFxuLy8gICAgICAgICAgICAgICAgIGFnZW50LnBvc2l0aW9uLnksXG4vLyAgICAgICAgICAgICAgICAgYWdlbnQucG9zaXRpb24uelxuLy8gICAgICAgICAgICAgKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0pO1xuXG4vLyAgICAgLyoqXG4vLyAgICAgICogQWRkIHNvbWUgYWdlbnRzXG4vLyAgICAgICovXG4vLyAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZ2VudHNPYmplY3RzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGFnZW50cy5wdXNoKHJlY2FzdC5hZGRBZ2VudCh7XG4vLyAgICAgICAgICAgICBwb3NpdGlvbjoge1xuLy8gICAgICAgICAgICAgICAgIHg6IC0yNS44ODUwLFxuLy8gICAgICAgICAgICAgICAgIHk6IC0xLjY0MTY2LFxuLy8gICAgICAgICAgICAgICAgIHo6IC01LjQxMzUwXG4vLyAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgcmFkaXVzOiAwLjgsXG4vLyAgICAgICAgICAgICBoZWlnaHQ6IDAuNSxcbi8vICAgICAgICAgICAgIG1heEFjY2VsZXJhdGlvbjogMS4wLFxuLy8gICAgICAgICAgICAgbWF4U3BlZWQ6IDIuMCxcbi8vICAgICAgICAgICAgIHVwZGF0ZUZsYWdzOiAwLCAvLyAmJiByZWNhc3QuQ1JPV0RfT0JTVEFDTEVfQVZPSURBTkNFLCAvLyAmIHJlY2FzdC5DUk9XRF9BTlRJQ0lQQVRFX1RVUk5TICYgcmVjYXN0LkNST1dEX09QVElNSVpFX1RPUE8gJiByZWNhc3QuQ1JPV0RfU0VQQVJBVElPTixcbi8vICAgICAgICAgICAgIHNlcGFyYXRpb25XZWlnaHQ6IDIwLjBcbi8vICAgICAgICAgfSkpO1xuLy8gICAgIH1cblxuLy8gICAgIHZhciByb3V0ZXM7XG5cbi8vICAgICB2YXIgbGFzdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuLy8gICAgIHZhciBhbmltYXRlID0gZnVuY3Rpb24gYW5pbWF0ZSAodGltZSkge1xuXG4vLyAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICAgICAgcmVjYXN0LmNyb3dkVXBkYXRlKDAuMSk7XG4vLyAgICAgICAgICAgICByZWNhc3QuY3Jvd2RHZXRBY3RpdmVBZ2VudHMoKTtcbi8vICAgICAgICAgfSwgMCk7XG5cbi8vICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcblxuLy8gICAgICAgICBsYXN0ID0gdGltZTtcbi8vICAgICAgICAgcmVuZGVyKCk7XG5cbi8vICAgICAgICAgaWYgKHN0YXRzKSBzdGF0cy51cGRhdGUoKTtcbi8vICAgICB9O1xuXG4vLyAgICAgYW5pbWF0ZShuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cbi8vICAgICBzZXF1ZW5jZSA9IGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VxdWVuY2UnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuLy8gICAgICAgICByb3V0ZXMgPSAwO1xuLy8gICAgICAgICBnb0F3YXkoKTtcbi8vICAgICB9O1xuXG4vLyAgICAgdmFyIGdvQXdheSA9IGZ1bmN0aW9uKCl7XG4vLyAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWdlbnRzT2JqZWN0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgKGZ1bmN0aW9uIChpKSB7XG4vLyAgICAgICAgICAgICAgICAgcmVjYXN0LmdldFJhbmRvbVBvaW50KHJlY2FzdC5jYihmdW5jdGlvbihwdDJ4LCBwdDJ5LCBwdDJ6KXtcbi8vICAgICAgICAgICAgICAgICAgICAgcmVjYXN0LmNyb3dkUmVxdWVzdE1vdmVUYXJnZXQoaSwgcHQyeCwgcHQyeSwgcHQyeik7XG4vLyAgICAgICAgICAgICAgICAgICAgIGlmICgrK3JvdXRlcyA8IE1BWF9IT1BTKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Lm9rKHRydWUsICdyb3V0ZSAnICsgcm91dGVzICsgJzogdG8gJyArIE1hdGgucm91bmQocHQyeCwgMikgKyAnLCcgKyBNYXRoLnJvdW5kKHB0MnksIDIpKyAnLCcgKyBNYXRoLnJvdW5kKHB0MnosIDIpKTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZ29Bd2F5LCA4MDAwICogTWF0aC5yYW5kb20oKSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VxdWVuY2UnKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRlc3QuZG9uZSgpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgfSkpO1xuLy8gICAgICAgICAgICAgfSkoaSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9O1xuXG4vLyAgICAg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