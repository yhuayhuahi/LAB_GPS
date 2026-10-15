import crypto from 'crypto';
import { branchRepository } from '../repositories/branch.repository';
import { CreateBranchInput, UpdateBranchInput } from '../schemas/branch.schema';
import { Branch } from '../types/domain';
import { AppError } from '../types/responses';

export class BranchService {
  async listBranches(activeOnly = true): Promise<Branch[]> {
    return branchRepository.findAll(activeOnly);
  }

  async getBranchById(id: string): Promise<Branch> {
    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw AppError.notFound(`No se encontró la distribuidora con ID: ${id}`);
    }
    return branch;
  }

  async createBranch(input: CreateBranchInput): Promise<Branch> {
    // Verificar código único
    const existing = await branchRepository.findByCode(input.code);
    if (existing) {
      throw AppError.conflict(
        `Ya existe una distribuidora registrada con el código '${input.code.toUpperCase()}'. Use un código diferente.`,
        'BRANCH_CODE_EXISTS'
      );
    }

    const newBranch: Omit<Branch, 'created_at'> = {
      id: `branch-${crypto.randomUUID()}`,
      code: input.code.toUpperCase(),
      name: input.name,
      address: input.address,
      phone: input.phone,
      manager_name: input.manager_name,
      observations: input.observations,
      is_active: true
    };

    return branchRepository.create(newBranch);
  }

  async updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
    await this.getBranchById(id);

    if (input.code) {
      const existing = await branchRepository.findByCode(input.code);
      if (existing && existing.id !== id) {
        throw AppError.conflict(
          `El código '${input.code.toUpperCase()}' ya está en uso por otra sede.`,
          'BRANCH_CODE_EXISTS'
        );
      }
    }

    const updated = await branchRepository.update(id, input);
    return updated!;
  }
}

export const branchService = new BranchService();
