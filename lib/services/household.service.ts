import { householdRepository } from "@/lib/repositories/household.repository";
import type { HouseholdMemberWithEmail } from "@/lib/repositories/household.repository";
import { parentRepository } from "@/lib/repositories/parent.repository";
import { Household } from "@/types/database";
import { ForbiddenError, NotFoundError, ServiceUnavailableError, ValidationError } from "@/lib/errors/app-errors";
import { getAdminClientOrNull } from "@/lib/supabase/admin";

export class HouseholdService {
  async createHousehold(parentId: string, name: string): Promise<Household> {
    const admin = getAdminClientOrNull();
    if (!admin) {
      throw new ServiceUnavailableError(
        "Household creation is temporarily unavailable. Server administrator: set SUPABASE_SERVICE_ROLE_KEY in the server environment (see .env.example)."
      );
    }
    const { data: household, error: householdError } = await admin
      .from("households")
      .insert({ name })
      .select()
      .single();

    if (householdError || !household) {
      throw new Error(`Failed to create household: ${householdError?.message || "Unknown error"}`);
    }

    const { error: memberError } = await admin.from("household_members").insert({
      household_id: household.id,
      parent_id: parentId,
      role: "owner",
    });

    if (memberError) {
      await admin.from("households").delete().eq("id", household.id);
      throw new Error(`Failed to add owner: ${memberError.message}`);
    }

    return household;
  }

  async getHouseholdsForParent(parentId: string): Promise<Household[]> {
    return householdRepository.findHouseholdsByParentId(parentId);
  }

  async getDefaultHouseholdId(parentId: string): Promise<string | null> {
    const households = await householdRepository.findHouseholdsByParentId(parentId);
    return households.length > 0 ? households[0].id : null;
  }

  async ensureMember(householdId: string, parentId: string): Promise<void> {
    const isMember = await householdRepository.isMember(householdId, parentId);
    if (!isMember) {
      throw new NotFoundError("Household or access denied");
    }
  }

  async inviteMember(householdId: string, inviterParentId: string, email: string): Promise<void> {
    await this.ensureMember(householdId, inviterParentId);

    const role = await householdRepository.findMemberRole(householdId, inviterParentId);
    if (role !== "owner") {
      throw new ForbiddenError("Only the household owner can invite guardians");
    }

    const parent = await parentRepository.findByEmail(email);
    if (!parent) {
      throw new NotFoundError("Parent account with that email");
    }

    const alreadyMember = await householdRepository.isMember(householdId, parent.id);
    if (alreadyMember) {
      throw new ValidationError("That person is already in this household");
    }

    await householdRepository.addMember({
      household_id: householdId,
      parent_id: parent.id,
      role: "member",
    });
  }

  async getMembersWithEmails(householdId: string, parentId: string): Promise<HouseholdMemberWithEmail[]> {
    await this.ensureMember(householdId, parentId);
    return householdRepository.findMembersWithEmailByHouseholdId(householdId);
  }

  async removeMember(householdId: string, removerParentId: string, targetParentId: string): Promise<void> {
    await this.ensureMember(householdId, removerParentId);
    await householdRepository.removeMember(householdId, targetParentId);
  }
}

export const householdService = new HouseholdService();
