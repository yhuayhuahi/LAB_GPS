import crypto from 'crypto';
import { productRepository } from '../repositories/product.repository';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';
import { Product } from '../types/domain';
import { AppError } from '../types/responses';

export class ProductService {
  async listProducts(activeOnly = true): Promise<Product[]> {
    return productRepository.findAll(activeOnly);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound(`No se encontró el libro con ID: ${id}`);
    }
    return product;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const existing = await productRepository.findByCode(input.code);
    if (existing) {
      throw AppError.conflict(
        `Ya existe un título registrado con el código editorial '${input.code.toUpperCase()}'.`,
        'PRODUCT_CODE_EXISTS'
      );
    }

    const newProduct: Omit<Product, 'created_at'> = {
      id: `prod-${crypto.randomUUID()}`,
      code: input.code.toUpperCase(),
      title: input.title,
      education_level: input.education_level,
      isbn: input.isbn,
      public_price: input.public_price,
      fixed_commission: input.fixed_commission,
      observations: input.observations,
      is_active: true
    };

    return productRepository.create(newProduct);
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const existing = await this.getProductById(id);

    if (input.code) {
      const existingCode = await productRepository.findByCode(input.code);
      if (existingCode && existingCode.id !== id) {
        throw AppError.conflict(
          `El código editorial '${input.code.toUpperCase()}' ya está asignado a otro título.`,
          'PRODUCT_CODE_EXISTS'
        );
      }
    }

    // Validar coherencia de comisiones si se actualiza precio o comisión
    const newPrice = input.public_price ?? existing.public_price;
    const newComm = input.fixed_commission ?? existing.fixed_commission;

    if (newComm >= newPrice) {
      throw AppError.badRequest(
        'La comisión fija unitaria debe ser menor que el precio oficial de venta al público',
        'INVALID_COMMISSION_VALUE'
      );
    }

    const updated = await productRepository.update(id, input);
    return updated!;
  }
}

export const productService = new ProductService();
