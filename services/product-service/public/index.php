<?php

require_once '../controllers/ProductController.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($method === 'GET' && ($path === '/' || $path === '/products' || $path === '/products/')) {
    $controller = new ProductController();
    $controller->getProducts();
} else {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint tidak valid untuk Product Service."]);
}
?>