const express = require("express");
const cors = require("cors");
require("dotenv").config();

const restaurantRoutes = require("./routes/restaurants");
const reviewRoutes = require("./routes/reviews");
const { readJsonFile } = require("./utils/fileManager");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "🍜 Restaurant Review API",
    version: "1.0.0",
    endpoints: {
      restaurants: "/api/restaurants",
      reviews: "/api/reviews",
      stats: "/api/stats",
    },
  });
});

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reviews", reviewRoutes);

// ========================================
// TODO: GET /api/stats - ดึงสถิติทั้งหมด
// ========================================
// งานที่ต้องทำ:
// 1. อ่านข้อมูล restaurants.json และ reviews.json
// 2. คำนวณ:
//    - totalRestaurants: จำนวนร้านทั้งหมด
//    - totalReviews: จำนวนรีวิวทั้งหมด
//    - averageRating: คะแนนเฉลี่ยของร้านทั้งหมด (ปัดเศษ 1 ตำแหน่ง)
//    - topRatedRestaurants: ร้าน 5 อันดับแรกที่มี rating สูงสุด
// 3. ส่งข้อมูลกลับในรูปแบบ: { success: true, data: {...} }
//
// คำใบ้:
// - ใช้ Array.reduce() เพื่อรวมคะแนน
// - ใช้ Array.sort() และ Array.slice(0, 5) เพื่อหา top 5
// - ระวัง: ร้านที่ยังไม่มีรีวิว (averageRating = 0) อาจมีปัญหาในการเรียง

app.get("/api/stats", async (req, res) => {
  try {
    // TODO: เขียนโค้ดที่นี่
    const restaurants = await readJsonFile("./data/restaurants.json");
    const reviews = await readJsonFile("./data/reviews.json");

    const totalRestaurants = restaurants.length;
    const totalReviews = reviews.length;

    const restaurantRatings = restaurants.map((restaurant) => {
      // ดึงรีวิวที่เกี่ยวข้องกับร้านนี้
      const restaurantReviews = reviews.filter(
        (review) => review.restaurantId === restaurant.id
      );

      // ถ้ามีรีวิว -> คำนวณคะแนนเฉลี่ย, ถ้าไม่มีรีวิว -> 0
      const avgRating =
        restaurantReviews.length > 0
          ? restaurantReviews.reduce((sum, r) => sum + r.rating, 0) /
            restaurantReviews.length
          : 0;

      return { ...restaurant, averageRating: avgRating };
    });

    // คำนวณ averageRating ของทุกรีวิวรวมกัน
    const ratedRestaurants = restaurantRatings.filter(
      (r) => r.averageRating > 0
    );
    const averageRating =
      ratedRestaurants.length > 0
        ? (
            ratedRestaurants.reduce((sum, r) => sum + r.averageRating, 0) /
            ratedRestaurants.length
          ).toFixed(1)
        : 0;
    const topRatedRestaurants = [...restaurantRatings]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name,
        averageRating: parseFloat(r.averageRating.toFixed(1)),
      }));

    // 5. ส่งข้อมูลกลับ
    res.json({
      success: true,
      data: {
        totalRestaurants,
        totalReviews,
        averageRating: parseFloat(averageRating),
        topRatedRestaurants,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติ",
    });
  }
});

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
