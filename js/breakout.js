var ball;
var ballRadius = 0.8;
var ballSpeed = 5;
var ballColor = 0x00ffff;
var ballDirection;
var prevBallPosition = new THREE.Vector3(0, 0, 0);

var MAX_TRAIL_LENGTH = 100000;
var trailPos = 0;

var MAX_FACE_WIREFRAME_LENGTH = 300000;
var faceWireframePos = 0;

var raycaster;

var prevIntersectionPoint;
var nextIntersectionPoint;
var nextIntersectionDirection;
var nextIntersectionFace;
var distanceToNextPoint;
var distanceTraveled;

var currSegmentTrail;
var trailHistory;
var faceWireframe;

function initBall(scene) {
    // add ball geometry to the scene
    var geometry = new THREE.SphereGeometry( ballRadius, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: ballColor} );
    ball = new THREE.Mesh( geometry, material );
    scene.add( ball );

    // randomize the ball direction for each run
    ballDirection = new THREE.Vector3(0, 0, 0);
    ballDirection.x = (Math.random() - 0.5) * 2.0;
    ballDirection.y = (Math.random() - 0.5) * 2.0;
    ballDirection.z = (Math.random() - 0.5) * 2.0;
    ballDirection.normalize();

    // create the ball trail, add it to the scene
    var trailHistoryMaterial = new THREE.LineBasicMaterial({ color: ballColor, transparent: true, opacity: 0.5});
    trailHistory = new THREE.Line(new THREE.Geometry(), trailHistoryMaterial, THREE.LinePieces);
    trailHistory.geometry.dynamic = true;
    trailHistory.frustumCulled = false;

    for (var i=0; i < MAX_TRAIL_LENGTH; i++){
        trailHistory.geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    }

    scene.add(trailHistory);

    var currSegmentMaterial = new THREE.LineBasicMaterial({ color: ballColor });
    currSegmentTrail = new THREE.Line(new THREE.Geometry(), currSegmentMaterial);
    currSegmentTrail.dynamic = true;
    currSegmentTrail.frustumCulled = false;

    currSegmentTrail.geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    currSegmentTrail.geometry.vertices.push(new THREE.Vector3(0, 0, 0));

    scene.add(currSegmentTrail);

    // create face wireframe line additions, and add it to the scene
    var wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5});
    faceWireframe = new THREE.Line(new THREE.Geometry(), wireframeMaterial, THREE.LinePieces);
    faceWireframe.geometry.dynamic = true;
    faceWireframe.frustumCulled = false;

    for (var i=0; i < MAX_FACE_WIREFRAME_LENGTH; i++){
        faceWireframe.geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    }

    scene.add(faceWireframe);

    raycaster = new THREE.Raycaster();
}

function updateBallPosition() {
    if (!ball || !meshObject) {
        return; // if scene hasn't been initialized yet - bail
    }

    if (!nextIntersectionPoint) {
        // calculate the initial intersection of the ball and the mesh (next intersection points will be updated when the ball changes direction)
        prevIntersectionPoint = ball.position.clone();
        calcNextIntersectionPoint(ball.position, ballDirection);
    }

    prevBallPosition.x = ball.position.x;
    prevBallPosition.y = ball.position.y;
    prevBallPosition.z = ball.position.z;

    ball.position.x += ballDirection.x * ballSpeed;
    ball.position.y += ballDirection.y * ballSpeed;
    ball.position.z += ballDirection.z * ballSpeed;

    distanceTraveled += prevBallPosition.distanceTo(ball.position);
    updateCurrSegmentTrail(prevIntersectionPoint, ball.position);

    if ((distanceTraveled + ballRadius) > distanceToNextPoint) {
        addSegmentToHistoryTrail(prevIntersectionPoint, ball.position.clone());
        addWireframePoint(ball.position.clone(), nextIntersectionFace);

        ballDirection = nextIntersectionDirection;

        prevIntersectionPoint = ball.position.clone();
        calcNextIntersectionPoint(ball.position, nextIntersectionDirection);
    }
}

function calcNextIntersectionPoint(origin, direction) {
    raycaster.set(origin, direction);
    var intersectionResult = raycaster.intersectObject(meshObject);

    if (intersectionResult.length > 0) {
        nextIntersectionPoint = intersectionResult[0].point;
        nextIntersectionDirection = intersectionResult[0].face.normal;
        nextIntersectionFace = intersectionResult[0].face;

        // add some randomness to the bounce direction, to make things more interesting..
        nextIntersectionDirection.x += (Math.random() - 0.5) * 0.8;
        nextIntersectionDirection.y += (Math.random() - 0.5) * 0.8;
        nextIntersectionDirection.z += (Math.random() - 0.5) * 0.8;
    }
    else {
        console.log("no intersection found, shooting to 0,0");
        nextIntersectionPoint = new THREE.Vector3(0, 0, 0);
        nextIntersectionDirection.x = -origin.x;
        nextIntersectionDirection.y = -origin.y;
        nextIntersectionDirection.z = -origin.z;

    }

    nextIntersectionDirection.normalize();
    distanceToNextPoint = origin.distanceTo(nextIntersectionPoint);
    distanceTraveled = 0.0;
}

function addSegmentToHistoryTrail(startPoint, endPoint) {
    var vertices = trailHistory.geometry.vertices;

    vertices[trailPos * 2].x = startPoint.x;
    vertices[trailPos * 2].y = startPoint.y;
    vertices[trailPos * 2].z = startPoint.z;

    vertices[trailPos * 2 + 1].x = endPoint.x;
    vertices[trailPos * 2 + 1].y = endPoint.y;
    vertices[trailPos * 2 + 1].z = endPoint.z;

    trailHistory.geometry.verticesNeedUpdate = true;
    trailPos = trailPos + 1;
}

function updateCurrSegmentTrail(startPoint, endPoint) {
    var vertices = currSegmentTrail.geometry.vertices;

    vertices[0].x = startPoint.x;
    vertices[0].y = startPoint.y;
    vertices[0].z = startPoint.z;

    vertices[1].x = endPoint.x;
    vertices[1].y = endPoint.y;
    vertices[1].z = endPoint.z;

    currSegmentTrail.geometry.verticesNeedUpdate = true;
}

function addWireframePoint(hitPoint, face) {
    var meshVertices = meshObject.geometry.attributes.position.array;

    var vertices = faceWireframe.geometry.vertices;

    // first line
    vertices[faceWireframePos * 6].x = meshVertices[face.a * 3];
    vertices[faceWireframePos * 6].y = meshVertices[face.a * 3 + 1];
    vertices[faceWireframePos * 6].z = meshVertices[face.a * 3 + 2];

    vertices[faceWireframePos * 6 + 1].x = hitPoint.x;
    vertices[faceWireframePos * 6 + 1].y = hitPoint.y;
    vertices[faceWireframePos * 6 + 1].z = hitPoint.z;

    // second line
    vertices[faceWireframePos * 6 + 2].x = meshVertices[face.b * 3];
    vertices[faceWireframePos * 6 + 2].y = meshVertices[face.b * 3 + 1];
    vertices[faceWireframePos * 6 + 2].z = meshVertices[face.b * 3 + 2];

    vertices[faceWireframePos * 6 + 3].x = hitPoint.x;
    vertices[faceWireframePos * 6 + 3].y = hitPoint.y;
    vertices[faceWireframePos * 6 + 3].z = hitPoint.z;

    // third line
    vertices[faceWireframePos * 6 + 4].x = meshVertices[face.c * 3];
    vertices[faceWireframePos * 6 + 4].y = meshVertices[face.c * 3 + 1];
    vertices[faceWireframePos * 6 + 4].z = meshVertices[face.c * 3 + 2];

    vertices[faceWireframePos * 6 + 5].x = hitPoint.x;
    vertices[faceWireframePos * 6 + 5].y = hitPoint.y;
    vertices[faceWireframePos * 6 + 5].z = hitPoint.z;

    faceWireframe.geometry.verticesNeedUpdate = true;
    faceWireframePos = faceWireframePos + 1;
}
