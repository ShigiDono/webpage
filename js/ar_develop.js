define(['three', 'three.js/examples/js/libs/stats.min', 'js-aruco/svd', 'js-aruco/posit1-patched', 'js-aruco/cv', 'js-aruco/aruco', 'threex/webcamgrabbing', 'threex/imagegrabbing', 'threex/videograbbing', 'threex/jsarucomarker', 'numeric', 'posit_est'], function (block_class, arcanoid_scene, UTILS) {
    //�V�[���̍쐬
    var scene = new THREE.Scene();
    //��������fov�͊p�x�H
    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    document.body.appendChild(renderer.domElement);

    //��ʃT�C�Y���ύX���ꂽ�ۂ̃C�x���g�n���h��
    function onWindowReSize() {
        camera.aspect = window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowReSize, false);

    //�I�u�W�F�N�g�̍쐬
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshNormalMaterial();
    var cube = new THREE.Mesh(geometry, material);
    cube.position.x = 0;
    cube.position.y = 0;
    cube.position.z = 0;
    scene.add(cube);

    //
    var geometry = new THREE.PlaneGeometry(10, 10, 10, 10)
    var material = new THREE.MeshBasicMaterial({
        wireframe: true
    })
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var mesh = new THREE.AxisHelper
    scene.add(mesh);

    camera.position.z = 5;

    //�J�����̍��W�Ȃǂ�ێ����Ă����ꏊ
    var pos = [0.0, 0.0, 5.0];
    var rotation = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
    var dict = { "x": pos, "R": rotation,"f":1.0,"video":null };

    //������dict���X�V��������ʒu���胋�[�`���𓮂���
    posest_inner(dict);

    var rotx = 0.0;
    var roty = 0.0;
    var rotz = 0.0;
    var render = function () {
        requestAnimationFrame(render);

        //
        f = dict["f"];
        var fovW = Math.atan2(0.5, f) * 2.0 * 180 / 3.1415;//canvas���̎���p
        if (dict["video"] != null) {
            var video = dict["video"];
            var vW = video.videoWidth;
            var vH = video.videoHeight;
            if (vW / vH > window.innerHeight / window.innerWidth) {//video���c��
                fovW *= (vH * window.innerWidth / vW / window.innerHeight);
            }
            else {//video������
                //���̊p�x�͕ς��Ȃ��̂łȂɂ����Ȃ�
            }
        }
        camera.fov = fovW * window.innerHeight / window.innerWidth;
        camera.position.x = dict["x"][0];
        camera.position.y = dict["x"][1];
        camera.position.z = dict["x"][2];
        //RzRyRx�s��̊e�s�����ɃO���[�o�����W�ł�i,j,k�ƂȂ��Ă��邩��]�u
        var q = POSITEST.fromMatrixToQuaternion(numeric.transpose(dict["R"]));
        var quaternion = camera.quaternion;
        quaternion.set(q[0],q[1], q[2], q[3]);
        quaternion.normalize();


        //�`��
        renderer.render(scene, camera);
    }

    //Chrome�Ȃ�console.log�Ńf�o�b�O�\���ł���
    console.log("render loop start!!");
    render();
});

function posest_inner(dict) {
    //dict��x��R�ɂ��ꂼ��O���[�o�����W�n�ł̃J�����̈ʒu�ƃJ�������W���(I�E�AJ��AK��O)���e��̍s�������
    //marker��mat�͊e�u�s�v���e�����̃x�N�g���ɂȂ��Ă��邱�Ƃɒ���
    /*
    var map = [{ "id": 0, "pos": [-7.5, 7.5, 0.0], "mat": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], "size": 5.0 },
		{ "id": 10, "pos": [7.5, 7.5, 0.0], "mat": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], "size": 5.0 },
		{ "id": 20, "pos": [-7.5, -7.5, 0.0], "mat": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], "size": 5.0 },
		{ "id": 30, "pos": [7.5, -7.5, 0.0], "mat": [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], "size": 5.0 },
		{ "id": 40, "pos": [0.0, 15.2, 5.5], "mat": [[1.0, 0.0, 0.0], [0.0, 0.0, 1.0], [0.0, -1.0, 0.0]], "size": 5.0 },
		{ "id": 50, "pos": [15.5, 0.0, 5.0], "mat": [[0.0, -1.0, 0.0], [0.0, 0.0, 1.0], [-1.0, 0.0, 0.0]], "size": 5.0 },
		{ "id": 60, "pos": [0.0, -14.5, 5.0], "mat": [[-1.0, 0.0, 0.0], [0.0, 0.0, 1.0], [0.0, 1.0, 0.0]], "size": 5.0 },
		{ "id": 70, "pos": [-17.5, 0.0, 5.0], "mat": [[0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0]], "size": 5.0 }]*/
    var onVert = [[0.0, -1.0, 0.0], [0.0, 0.0, 1.0], [-1.0, 0.0, 0.0]];
    var onHori = [[0.0, -1.0, 0.0], [1.0, 0.0, 0.0], [0.0, 0.0, 1.0]];
    var size = 5.0;
    var map = [
        { "id": 0, "pos": [8.5, 6.5, 9.9], "mat": onVert },
        { "id": 10, "pos": [8.5, 0.3, 9.9], "mat": onVert },
        { "id": 20, "pos": [8.5, -5.4, 7.4], "mat": onVert },
        { "id": 30, "pos": [8.5, 5.7, 3.5], "mat": onVert },
        { "id": 40, "pos": [8.5, -0.4, 3.5], "mat": onVert },
        { "id": 50, "pos": [8.5, -6.6, 3.5], "mat": onVert },
        { "id": 60, "pos": [5.6, 6.4, 0.0], "mat": onHori },
        { "id": 70, "pos": [5.6, 0.4, 0.0], "mat": onHori },
        { "id": 80, "pos": [5.6, -5.5, 0.0], "mat": onHori },
        { "id": 90, "pos": [-0.7, 6.4, 0.0], "mat": onHori }
    ]
    for (var i = 0; i < map.length; i++) {
        map[i]["size"] = size;
    }
    //var imageGrabbing = new THREEx.ImageGrabbing("images/test2.jpg");
    //var imageGrabbing = new THREEx.VideoGrabbing("videos/sample.3gp");
    var imageGrabbing = new THREEx.WebcamGrabbing();

    //�摜��\��
    document.body.appendChild(imageGrabbing.domElement);

    var domElement = imageGrabbing.domElement;

    var estimater = new POSITEST.positionEstimater(map);

    var f = 1.0;
    var n = 0.01;

    var timerID = setInterval(function () {
        var _pos = estimater.est_pos(domElement, f, true);

        if (_pos != null) {

            //�\��
            
            console.log("-----CAMERA POSITION-------")
            console.log("position:%5.2f, %5.2f, %5.2f", _pos["x"][0], _pos["x"][1], _pos["x"][2]);
            console.log("rotation");
            for (var i = 0; i < 3; i++) {
                console.log("%5.2f, %5.2f, %5.2f", _pos["R"][i][0], _pos["R"][i][1], _pos["R"][i][2]);
            }
            console.log("f %.2f", _pos["f_wo"]);
            console.log("ave. f %.2f", f);

            //�X�V
            if (_pos["f_wo"] != null) {
                f = (n * f + _pos["f_wo"]) / (n + 1);
                n = n + 1;
            }

            //dict�ɍŐV�����i�[
            dict["x"] = _pos["x"];
            dict["R"] = _pos["R"];
            dict["f"] = f;
            dict["video"] = domElement;

            console.log("W", domElement.videoWidth);
            console.log("H", domElement.videoHeight);
        }
    }, 50);
}