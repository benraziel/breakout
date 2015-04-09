var ball;
var ballRadius = 1.5;
var ballSpeed = 0.5;
var prevBallPosition = new THREE.Vector3(0, 0, 0);

var raycaster;
var nextIntersectionPoint;
var nextIntersectionDirection;
var distanceToNextPoint;
var distanceTraveled;

function initBall(scene, camera) {
    // add ball geometry to the scene
    var geometry = new THREE.SphereGeometry( ballRadius, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0x00ffff} );
    ball = new THREE.Mesh( geometry, material );
    scene.add( ball );

    // randomize the ball direction for each run
    ballDirection = new THREE.Vector3(0, 0, 0);
    ballDirection.x = (Math.random() - 0.5) * 2.0;
    ballDirection.y = (Math.random() - 0.5) * 2.0;
    ballDirection.z = (Math.random() - 0.5) * 2.0;
    ballDirection.normalize();

    raycaster = new THREE.Raycaster();
}

function updateBallPosition() {
    if (!ball || !meshObject) {
        return; // if scene hasn't been initialized yet - bail
    }

    if (!nextIntersectionPoint) {
        // calculate the initial intersection of the ball and the mesh (next intersection points will be updated when the ball changes direction)
        calcNextIntersectionPoint(ball.position, ballDirection);
    }

    prevBallPosition.x = ball.position.x;
    prevBallPosition.y = ball.position.y;
    prevBallPosition.z = ball.position.z;

    ball.position.x += ballDirection.x * ballSpeed;
    ball.position.y += ballDirection.y * ballSpeed;
    ball.position.z += ballDirection.z * ballSpeed;

    distanceTraveled += prevBallPosition.distanceTo(ball.position);

    if ((distanceTraveled + ballRadius) > distanceToNextPoint) {
        ballDirection = nextIntersectionDirection;
        calcNextIntersectionPoint(ball.position, nextIntersectionDirection);
        debugger;
    }
}

function calcNextIntersectionPoint(origin, direction) {
    raycaster.set(origin, direction);
    var intersectionResult = raycaster.intersectObject(meshObject);
    console.log(intersectionResult);
    console.log(intersectionResult.length);

    if (intersectionResult.length > 0) {
        nextIntersectionPoint = intersectionResult[0].point;
        nextIntersectionDirection = intersectionResult[0].face.normal;
        distanceToNextPoint = origin.distanceTo(nextIntersectionPoint);
        distanceTraveled = 0.0;
    }
}