{
  "scripts": {
    "start": "node platform-bootstrap.js",
    "platform": "node platform-bootstrap.js",
    "inspect": "node platform-bootstrap.js --inspect",
    "standalone": "node platform-bootstrap.js --mode=standalone",
    "edge": "node platform-bootstrap.js --mode=edge-assisted",
    "client": "node platform-bootstrap.js --mode=client-only",
    "dev": "node --watch platform-bootstrap.js",
    "test": "node tests/metrics.test.js",
    "deploy": "bash deployment/deploy.sh",
    "setup": "bash deployment/setup-oracle.sh"
  }
}
