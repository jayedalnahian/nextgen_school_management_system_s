import { IQueryParams } from "../../interface/query.interface.js";

export type IClass = {
  name: string;
  section?: string;
  monthlyFee: number;
  capacity?: number;
};

export interface IClassQueryParams extends IQueryParams {
  section?: string;
  isDeleted?: string;
}
