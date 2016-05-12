define(['engine/utils', 'engine/block', 'three', 'OrbitControls', 'StereoEffect', 'DeviceOrientationControls', 'SPE'], function (UTILS, block_class) {
    var arcanoid_scene = function(texture_set) {
        this.blocks = [];
        this.init(texture_set); 
        window.addEventListener('resize', this.resize.bind(this), false);
        setTimeout(this.resize.bind(this), 1);
    }


    arcanoid_scene.prototype.init = function(texture_set) {
        this.texture_set = texture_set;
        if (!this.texture_set) {
            this.texture_set = UTILS.LOWRES_TEXTURES;
        }
        console.log(texture_set)
        this.clock = new THREE.Clock();
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
        console.log(window.devicePixelRatio);
        this.default_renderer = this.renderer;


        this.loader = new THREE.JSONLoader(); // init the loader util
        this.element = this.renderer.domElement;
        this.container = document.getElementById('example');
        this.container.appendChild(this.element);

        this.effect = new THREE.StereoEffect(this.renderer);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000);//90, 1, 0.001, 1000);
        this.camera.position.set(-100, 50, 200);
        this.camera.up.set(0, 0, 1);
        this.scene.add(this.camera);

        this.block_holder = new THREE.Object3D();
        this.scene.add(this.block_holder);


    }

    arcanoid_scene.prototype.set_environment = function(type) {
        this.environment = type;
        if (type == "ar") {
            this.renderer.setClearColor(0x000000, 0);
        } else if (type == "projector") {
            this.renderer.setClearColor(0x000000, 1.0);
        } else {
            var shader = THREE.ShaderLib['cube']; // init cube shader from built-in lib
            shader.uniforms['tCube'].value = this.cubemap; // apply textures to shader

            // create shader material
            var skyBoxMaterial = new THREE.ShaderMaterial({
                fragmentShader: shader.fragmentShader,
                vertexShader: shader.vertexShader,
                uniforms: shader.uniforms,
                depthWrite: false,
                depthTest: false,
                side: THREE.BackSide
            });
            this.skybox = new THREE.Mesh(
                new THREE.CubeGeometry(2000, 2000, 2000),
                skyBoxMaterial
            );

            this.scene.add(this.skybox);

        }
    }

    arcanoid_scene.prototype.set_render_callback = function(callback) {
        this.render_callback = callback;
    }
    arcanoid_scene.prototype.set_update_callback = function(callback) {
        this.update_callback = callback;
    }

    arcanoid_scene.prototype.init_controls = function() {
        /*this.controls = new THREE.OrbitControls(this.camera, this.element);
        this.controls.rotateUp(Math.PI / 4);
        this.controls.target.set(//0, 300, 0);
        //    this.camera.position.x + 0.1,
            this.camera.position.y,
            this.camera.position.z
        );///
        window.addEventListener('deviceorientation', this.set_orientation_controls.bind(this), true);*/
    }
    arcanoid_scene.prototype.fullscreen = function() {
        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        } else if (this.container.msRequestFullscreen) {
            this.container.msRequestFullscreen();
        } else if (this.container.mozRequestFullScreen) {
            this.container.mozRequestFullScreen();
        } else if (this.container.webkitRequestFullscreen) {
            this.container.webkitRequestFullscreen();
        }
    }
    arcanoid_scene.prototype.set_orientation_controls = function(e) {
        if (!e.alpha) {
            return;
        }

        this.controls = new THREE.DeviceOrientationControls(this.camera, true);
        this.controls.connect();
        this.controls.update();

        this.element.addEventListener('click', this.fullscreen.bind(this), false);

        window.removeEventListener('deviceorientation', this.set_orientation_controls(this), true);
    }
    arcanoid_scene.prototype.init_environment_default = function() {
        //creating skymap
        var urls = [
            'resources/textures/nx.jpg',
            'resources/textures/px.jpg',
            'resources/textures/py.jpg',
            'resources/textures/ny.jpg',
            'resources/textures/pz.jpg',
            'resources/textures/nz.jpg'
        ];

        this.cubemap = THREE.ImageUtils.loadTextureCube(urls); // load textures
        this.cubemap.format = THREE.RGBFormat;


        // create skybox mesh

        this.light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
        this.scene.add(this.light);
              var light = new THREE.DirectionalLight( 0xffddcc, 1 );
      light.position.set( 1, 0.75, 0.5 );
      this.scene.add( light );
      var light = new THREE.DirectionalLight( 0xccccff, 1 );
      light.position.set( -1, 0.75, -0.5 );
      this.scene.add( light );
    }
    arcanoid_scene.prototype.init_blocks = function(map) {
        var circuit_materials = {};
        var block_material = new THREE.MeshPhongMaterial({
            color: 0xe5e5ef,
            shininess: 300.0,
            specular: 0xffffff,
            shading: THREE.FlatShading,
            transparent: true,
            emissive: 0xf0f0f0,
            normalMap: THREE.ImageUtils.loadTexture(
                this.texture_set.block_normals
            ),
            map: THREE.ImageUtils.loadTexture(
                this.texture_set.block_occlusion
            ),
            envMap: this.cubemap,
        });

        var circuit_texture = THREE.ImageUtils.loadTexture(this.texture_set.pcb);
        var circuit_gradient_texture = THREE.ImageUtils.loadTexture(this.texture_set.pcb_gradient);

        var vertShader =
            "varying vec2 vUv;\
        \
        void main()\
        {\
          vUv = uv;\
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\
          gl_Position = projectionMatrix * mvPosition;\
        }";
        var fragShader =
            "precision highp float;\
         \
        varying vec2 vUv;\
        uniform float time;\
        uniform float freq;\
        uniform float shift;\
        uniform vec4 color_on;\
        uniform vec4 color_off;\
        uniform sampler2D pcb;\
        uniform sampler2D pcb_gradient;\
        const float step = 2.0;\
        \
        void main()\
        {\
            float t = mod(time, step)/2.0;\
            float v = 1.0 - texture2D(pcb_gradient, vUv).r;\
            const float mi = 30.0, ma = 90.0;\
            float o = (clamp(sin((time+v+shift)*(2.0 + freq))*100.0, mi, ma) - mi)/(ma-mi);/*clamp(-1000.0*(v - t)*(v-t) + 10.0, 0.0, 1.0);*/\
            float p = texture2D(pcb, vUv).r;\
            gl_FragColor = vec4(1.0, 1.0, 1.0, p)*mix(color_off, color_on, p*o);\
        }";
        circuit_texture.wrapS = THREE.RepeatWrapping;
        circuit_texture.wrapT = THREE.RepeatWrapping;
        circuit_gradient_texture.wrapS = THREE.RepeatWrapping;
        circuit_gradient_texture.wrapT = THREE.RepeatWrapping;
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                time: {
                    type: 'f',
                    value: 1.0
                },
                freq: {
                    type: 'f',
                    value: 1.0
                },
                shift: {
                    type: 'f',
                    value: 1.0
                },
                color_on: {
                    type: 'v4',
                    value: new THREE.Vector4(1.0, .0, .0, 1.0)
                },
                color_off: {
                    type: 'v4',
                    value: new THREE.Vector4(0.3, 0.0, 0, 1)
                },
                pcb: {
                    type: 't',
                    value: circuit_texture
                },
                pcb_gradient: {
                    type: 't',
                    value: circuit_gradient_texture
                },
            },
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
            lights: false
        });
        var out_blocks = [];
        for (var i in map) {
            var block = new block_class(block_material, {
                shift: Math.random() * 3,
                frequency: Math.random() * 3 + 2,
                amplitude: Math.random() * 5 + 2
            });
            //move here circuit material too
            if (!(map[i].color in circuit_materials)) {
                var material = mat.clone();
                material.uniforms.color_on.value = UTILS.hexToRgb(map[i].color);
                material.uniforms.color_off.value = new THREE.Vector4(
                    material.uniforms.color_on.value.x / UTILS.PCB_DARKEN_FACTOR,
                    material.uniforms.color_on.value.y / UTILS.PCB_DARKEN_FACTOR,
                    material.uniforms.color_on.value.z / UTILS.PCB_DARKEN_FACTOR, 1.0);
                material.polygonOffset = true;
                material.depthWrite = false;
                material.polygonOffsetFactor = -1;
                material.polygonOffsetUnits = -2;
                circuit_materials[map[i].color] = material;
            }
            block.circuit_mesh.material = circuit_materials[map[i].color].clone();
            block.circuit_mesh.material.uniforms.pcb_gradient.value = circuit_gradient_texture;
            block.circuit_mesh.material.uniforms.pcb.value = circuit_texture;
            block.circuit_mesh.material.uniforms.freq.value = block.freq;
            block.circuit_mesh.material.uniforms.shift.value = block.sh;
            block.rotate(Math.PI / 2, UTILS.randi(0, 4) * Math.PI / 2, 0);
            block.move(map[i].x, map[i].y);

            this.blocks.push(block);
        }
        return this.blocks;
    }

    arcanoid_scene.prototype.load_geometry = function() {
        // TODO: may be unsafe, check what is coming first map or geometry data
        this.loader.load('resources/models/block.js', function(geometry) {
            // create a new material
            this.block_geometry = geometry;
            var material = new THREE.MeshPhongMaterial({
                color: 0xe5e5ef,
                shininess: 999.0,
                ambient: 0xff0000,
                specular: 0xffffff,
                shading: THREE.FlatShading
            });
            for (var i = 0; i < this.blocks.length; i++) {
                var mesh = new THREE.Mesh(
                    this.block_geometry,
                    this.blocks[i].block_mesh.material
                );

                mesh.position.copy(this.blocks[i].block_mesh.position);
                mesh.rotation.copy(this.blocks[i].block_mesh.rotation);
                mesh.scale.copy(this.blocks[i].block_mesh.scale);
                this.blocks[i].block_mesh = mesh;
                this.block_holder.add(this.blocks[i].block_mesh);
            }
        }.bind(this));

        this.loader.load('resources/models/circuit.js', function(geometry) {
            // create a new material
            this.circuit_geometry = geometry;

            for (var i = 0; i < this.blocks.length; i++) {
                var mesh = new THREE.Mesh(
                    this.circuit_geometry,
                    this.blocks[i].circuit_mesh.material
                );

                mesh.position.copy(this.blocks[i].circuit_mesh.position);
                mesh.rotation.copy(this.blocks[i].circuit_mesh.rotation);
                mesh.scale.copy(this.blocks[i].circuit_mesh.scale);
                this.blocks[i].circuit_mesh = mesh;
                this.scene.add(mesh);

            }
        }.bind(this));
    };
    arcanoid_scene.prototype.create_particle_system = function() {
        emitterSettings = {
            type: SPE.distributions.SPHERE,
            position: {
                spread: new THREE.Vector3(5),
                radius: 1,
            },
            velocity: {
                value: new THREE.Vector3(50),
                //spread: new THREE.Vector3(30, 200, 200),
                //distribution: SPE.distributions.BOX
            },
            acceleration: {
                value: new THREE.Vector3(0, -100, 0),
                spread: new THREE.Vector3(100, 0, 100),
                distribution: SPE.distributions.BOX
            },  
            size: {
                value: [ 4, 0 ]
            },
            opacity: {
                value: [1, 0]
            },
            color: {
                value: [new THREE.Color('blue'),new THREE.Color('white')]
            },
            particleCount: 500,
            alive: true,
            duration: 0.1,
            isStatic: false,
            maxAge: {
                value: 1.8
            }
        };
        explosionSettings = {
            alive: true,
            particleCount: 20,
            type: SPE.distributions.SPHERE,
//            duration: 0.1,
            position: {
                radius: 1
            },
            maxAge: { value: 2 },
            duration: 1,
            activeMultiplier: 20,
            velocity: {
                value: new THREE.Vector3( 50 )
            },
            size: { value: [100, 500] },
            color: {
                value: [
                    new THREE.Color( 0.5, 0.1, 0.05 ),
                    new THREE.Color( 0.2, 0.2, 0.2 )
                ]
            },
            opacity: { value: [0.5, 0.35, 0.1, 0] }
        };
        this.group = new SPE.Group({
            texture: {
                value: THREE.ImageUtils.loadTexture(this.texture_set.spark)
            },
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.explosion_group = new SPE.Group( {
            texture: {
                value: THREE.ImageUtils.loadTexture(this.texture_set.explosion),
                frames: new THREE.Vector2( 5, 5 ),
                loop: 1
            },
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            scale: 1600
        } );
        this.particle_system_pos = new THREE.Vector3();

        this.group.addPool( 10, emitterSettings, false );
        this.explosion_group.addPool( 10, explosionSettings, false );

        // Add particle group to scene.
        this.group.mesh.frustumCulled = false;
        this.explosion_group.mesh.frustumCulled = false;
        this.scene.add(this.group.mesh);
        this.scene.add(this.explosion_group.mesh);

        setInterval(function() {
            //this.group.triggerPoolEmitter( 1, (this.particle_system_pos.set( randi(30, 100), randi(0, 10), randi(-60, 60) )) )
        }.bind(this), 1000);
        var k = 0;
        setInterval(function(){
            var n = (k%4)*4 + Math.floor(k/4);
            this.kill_block(n);
            k++;
        }.bind(this), 10000)

    }
    arcanoid_scene.prototype.resize = function() {
        var width = this.container.offsetWidth;
        var height = this.container.offsetHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.effect.setSize(width, height);
    }
    arcanoid_scene.prototype.kill_block = function(i) {
        if (i in this.blocks) {
            this.blocks[i].deadTime = this.clock.elapsedTime;
            this.group.triggerPoolEmitter( 1, (this.particle_system_pos.set( this.blocks[i].block_mesh.position.x-50*UTILS.BLOCK_SCALE_FACTOR, this.blocks[i].block_mesh.position.y, this.blocks[i].block_mesh.position.z + 100*UTILS.BLOCK_SCALE_FACTOR )));
            this.explosion_group.triggerPoolEmitter( 1, (this.particle_system_pos.set( this.blocks[i].block_mesh.position.x-50*UTILS.BLOCK_SCALE_FACTOR, this.blocks[i].block_mesh.position.y, this.blocks[i].block_mesh.position.z + 100*UTILS.BLOCK_SCALE_FACTOR )));
        }
    }

    arcanoid_scene.prototype.update = function(dt) {
        this.resize();

        if (this.environment != "ar" && this.controls) {
            this.camera.updateProjectionMatrix();

            this.controls.update(dt);
        }

        this.group.tick(dt);
        this.explosion_group.tick(dt);
        if (this.update_callback) {
            this.update_callback(dt);
        }
        /*if (this.particle_system.isActive) {
            this.particle_system.update(dt);
        }*/
    }

    arcanoid_scene.prototype.render = function(dt) {
        this.default_renderer.render(this.scene, this.camera);
        if (this.render_callback) {
            this.render_callback(dt);
        }
    }

    arcanoid_scene.prototype.animate = function(t) {
        var dt = this.clock.getDelta();
        requestAnimationFrame(this.animate.bind(this));
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i].animate(this.clock.elapsedTime);
        }
        this.update(dt);
        this.render(dt);
    }
    return arcanoid_scene;
});
