import { householdService } from "@/lib/services/household.service";
import { householdChildrenRepository } from "@/lib/repositories/household-children.repository";
import {
  verifyAndDecodeChildState,
  exchangeCodeForUserInfo,
} from "@/lib/services/child-oauth.service";
import { HouseholdChild } from "@/types/database";
import { NotFoundError, UnauthorizedError } from "@/lib/errors/app-errors";

export class ChildConnectionService {
  async list(householdId: string, parentId: string): Promise<HouseholdChild[]> {
    await householdService.ensureMember(householdId, parentId);
    return householdChildrenRepository.findByHouseholdId(householdId);
  }

  async linkFromState(signedState: string, code: string, currentParentId: string): Promise<string> {
    const payload = verifyAndDecodeChildState(signedState);
    if (payload.parentId !== currentParentId) {
      throw new UnauthorizedError("Session does not match the account that started the connection");
    }
    await householdService.ensureMember(payload.householdId, currentParentId);
    const userInfo = await exchangeCodeForUserInfo(code, payload.redirectOrigin);
    await householdChildrenRepository.upsert({
      household_id: payload.householdId,
      google_sub: userInfo.sub,
      email: userInfo.email,
      display_name: userInfo.display_name,
      linked_by: currentParentId,
    });
    return payload.householdId;
  }

  async deleteChild(childId: string, parentId: string): Promise<void> {
    const child = await householdChildrenRepository.findById(childId);
    if (!child) throw new NotFoundError("Child");
    await householdService.ensureMember(child.household_id, parentId);
    await householdChildrenRepository.deleteById(childId);
  }
}

export const childConnectionService = new ChildConnectionService();
