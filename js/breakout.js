var ball;
var ballRadius = 1.5;
var ballSpeed = 1;
var ballColor = 0x00ffff;
var ballDirection;
var prevBallPosition = new THREE.Vector3(0, 0, 0);

var MAX_TRAIL_LENGTH = 50000;
var trailPos = 0;

var raycaster;

var prevIntersectionPoint;
var nextIntersectionPoint;
var nextIntersectionDirection;
var distanceToNextPoint;
var distanceTraveled;

var currSegmentTrail;
var trailHistory;

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

        // add some randomness to the bounce direction, to make things more interesting..
        nextIntersectionDirection.x += (Math.random() - 0.5) * 0.2;
        nextIntersectionDirection.y += (Math.random() - 0.5) * 0.2;
        nextIntersectionDirection.z += (Math.random() - 0.5) * 0.2;
        nextIntersectionDirection.normalize();

        distanceToNextPoint = origin.distanceTo(nextIntersectionPoint);
        distanceTraveled = 0.0;
    }
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