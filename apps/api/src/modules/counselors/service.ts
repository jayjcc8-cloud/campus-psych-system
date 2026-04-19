import {
  getCounselorDetail as getCounselorDetailFromRepository,
  listCounselors as listCounselorsFromRepository
} from "../../repositories/reference-repository";

export function listCounselors() {
  return listCounselorsFromRepository();
}

export function getCounselorDetail(id: string) {
  return getCounselorDetailFromRepository(id);
}
