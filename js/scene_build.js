{
    name: 'scene',
    out: 'build/scene.js',
    paths: {
        three: 'three.js/build/three',
        DeviceOrientationControls: 'third-party/threejs/DeviceOrientationControls',
        OrbitControls: 'third-party/threejs/OrbitControls',
        StereoEffect: 'third-party/threejs/StereoEffect',
        SPE: 'third-party/SPE',
        TrackballControls: 'three.js/examples/js/controls/TrackballControls',
    },
    shim: {
        DeviceOrientationControls: {
            deps: ['three']
        },
        OrbitControls: {
            deps: ['three']
        },
        StereoEffect: {
            deps: ['three']
        },
        SPE: {
            deps: ['three']
        },
        TrackballControls: {
            deps: ['three']
        }
    }
}

