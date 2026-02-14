import { householdService } from "@/lib/services/household.service";
import { youtubeConnectionRepository } from "@/lib/repositories/youtube-connection.repository";
import {
  encryptRefreshToken,
  exchangeCodeForTokens,
  verifyAndDecodeState,
} from "@/lib/services/youtube-oauth.service";
import { NotFoundError, UnauthorizedError } from "@/lib/errors/app-errors";

export interface YoutubeConnectionStatus {
  connected: boolean;
  channelId?: string | null;
}

export class YoutubeConnectionService {
  async getStatus(householdId: string, parentId: string): Promise<YoutubeConnectionStatus> {
    await householdService.ensureMember(householdId, parentId);
    const row = await youtubeConnectionRepository.findByHouseholdId(householdId);
    if (!row) return { connected: false };
    return { connected: true, channelId: row.youtube_channel_id };
  }

  async linkConnection(
    householdId: string,
    parentId: string,
    code: string,
    requestOrigin?: string
  ): Promise<void> {
    await householdService.ensureMember(householdId, parentId);
    const { refresh_token, channelId } = await exchangeCodeForTokens(code, requestOrigin);
    const encrypted = encryptRefreshToken(refresh_token);
    await youtubeConnectionRepository.upsert({
      household_id: householdId,
      encrypted_refresh_token: encrypted,
      youtube_channel_id: channelId ?? null,
      linked_by: parentId,
    });
  }

  async linkConnectionFromState(signedState: string, code: string, currentParentId: string): Promise<string> {
    const payload = verifyAndDecodeState(signedState);
    if (payload.parentId !== currentParentId) {
      throw new UnauthorizedError("Session does not match the account that started the connection");
    }
    await this.linkConnection(payload.householdId, currentParentId, code, payload.redirectOrigin);
    return payload.householdId;
  }

  async unlink(householdId: string, parentId: string): Promise<void> {
    await householdService.ensureMember(householdId, parentId);
    const existing = await youtubeConnectionRepository.findByHouseholdId(householdId);
    if (!existing) throw new NotFoundError("YouTube connection");
    await youtubeConnectionRepository.deleteByHouseholdId(householdId);
  }
}

export const youtubeConnectionService = new YoutubeConnectionService();
