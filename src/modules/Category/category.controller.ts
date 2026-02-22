import { Request, Response } from "express";
import { CategoryService } from "./category.service";

const getAllCategories = async (req: Request, res: Response) => {
  try {
    const result = await CategoryService.getAllCategoriesFromDB();
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const createCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await CategoryService.createCategoryIntoDB(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await CategoryService.updateCategoryIntoDB({
      id: categoryId,
      ...req.body,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const CategoryController = {
  getAllCategories,
  createCategory,
  updateCategory,
};
