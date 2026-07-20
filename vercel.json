{
  "version": 2,
  "functions": {
    "api/index.php": {
      "runtime": "vercel-php@0.8.0"
    }
  },
  "routes": [
    {
      "src": "/(css|js|images|assets)/(.*)",
      "dest": "/public/$1/$2"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.php"
    }
  ]
}