import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { branchRepository } from '../repositories/branch.repository';
import { userRepository } from '../repositories/user.repository';
import { CreateBranchInput, UpdateBranchInput, CreateBranchUserInput } from '../schemas/branch.schema';
import { Branch, User } from '../types/domain';
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

  async listBranchUsers(branchId: string): Promise<Omit<User, 'password_hash'>[]> {
    await this.getBranchById(branchId);
    const users = await userRepository.findByBranchId(branchId);
    return users.map(({ password_hash: _pass, ...rest }) => rest);
  }

  async createUserForBranch(branchId: string, input: CreateBranchUserInput): Promise<Omit<User, 'password_hash'>> {
    await this.getBranchById(branchId);

    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict(
        `Ya existe un usuario registrado con el correo '${input.email}'`,
        'USER_EMAIL_EXISTS'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(input.password, salt);

    const newUser = await userRepository.create({
      id: `user-${crypto.randomUUID()}`,
      email: input.email.toLowerCase(),
      password_hash,
      full_name: input.full_name,
      role_id: input.role_id || 'role-03',
      branch_id: branchId,
      observations: input.observations,
      is_active: true
    });

    const { password_hash: _pass, ...rest } = newUser;
    return rest;
  }
}

export const branchService = new BranchService();
