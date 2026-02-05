import { parentRepository } from "@/lib/repositories/parent.repository";
import { NotFoundError } from "@/lib/errors/app-errors";

/**
 * Parent service for business logic related to parents
 */
export class ParentService {
  /**
   * Find parent by email (for device linking)
   * Returns only parent ID for security
   */
  async findParentByEmail(email: string): Promise<string> {
    const parent = await parentRepository.findByEmail(email);
    if (!parent) {
      throw new NotFoundError("Parent account");
    }
    return parent.id;
  }

  /**
   * Verify parent exists by ID
   */
  async verifyParentExists(parentId: string): Promise<boolean> {
    const parent = await parentRepository.findById(parentId);
    return !!parent;
  }
}

// Export singleton instance
export const parentService = new ParentService();
