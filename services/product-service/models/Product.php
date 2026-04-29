<?php

class Product {
    private $conn;
    private $table_name = "products";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readPaging($from_record_num, $records_per_page, $category_id = null) {
      
        $query = "SELECT p.id, p.name, p.description, p.price, p.stock, c.name as category_name
                  FROM " . $this->table_name . " p
                  LEFT JOIN categories c ON p.category_id = c.id ";

        // filter jika user memilih kategori tertentu
        if ($category_id) {
            $query .= " WHERE p.category_id = :category_id ";
        }

        // Urutkan dari yang terbaru dan batasi jumlahnya
        $query .= " ORDER BY p.created_at DESC LIMIT :from_record_num, :records_per_page";

        $stmt = $this->conn->prepare($query);

        if ($category_id) {
            $stmt->bindParam(":category_id", $category_id);
        }
        $stmt->bindParam(":from_record_num", $from_record_num, PDO::PARAM_INT);
        $stmt->bindParam(":records_per_page", $records_per_page, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt;
    }

    public function countAll($category_id = null) {
        $query = "SELECT id FROM " . $this->table_name;
        if ($category_id) {
            $query .= " WHERE category_id = :category_id";
        }
        $stmt = $this->conn->prepare($query);
        if ($category_id) {
            $stmt->bindParam(":category_id", $category_id);
        }
        $stmt->execute();
        return $stmt->rowCount();
    }
}
?>