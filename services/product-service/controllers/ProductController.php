<?php

require_once '../config/database.php';
require_once '../models/Product.php';

class ProductController {
    public function getProducts() {
        // agar merespons dalam format JSON
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json; charset=UTF-8");

        
        $database = new Database();
        $db = $database->getConnection();
        $product = new Product($db);

        $page = isset($_GET['page']) ? $_GET['page'] : 1;
        $category_id = isset($_GET['category']) ? $_GET['category'] : null;
        
        // Batas data per halaman
        $records_per_page = 5; 
        $from_record_num = ($records_per_page * $page) - $records_per_page;

        // Ambil data
        $stmt = $product->readPaging($from_record_num, $records_per_page, $category_id);
        $num = $stmt->rowCount();

        if($num > 0) {
            $products_arr = array();
            $products_arr["data"] = array();
            
            // Meta-data untuk Pagination
            $products_arr["pagination"] = array(
                "total_records" => $product->countAll($category_id),
                "current_page" => (int)$page,
                "records_per_page" => $records_per_page
            );

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
                array_push($products_arr["data"], $row);
            }

            http_response_code(200);
            echo json_encode($products_arr);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Produk tidak ditemukan."));
        }
    }
}
?>