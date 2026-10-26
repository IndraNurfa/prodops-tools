/**
 * CSV → SQL conversion logic
 * Ported from the original single-file HTML / convert_to_sql.py
 */

export type SqlValueType = "text" | "bool" | "num" | "int" | "date_iso";

export function sqlVal(val: unknown, vtype: SqlValueType = "text"): string {
  if (val === null || val === undefined) return "NULL";
  let str = String(val).trim();
  if (str === "" || str.toUpperCase() === "NULL") return "NULL";

  if (vtype === "bool") {
    return ["true", "1", "t"].includes(str.toLowerCase()) ? "true" : "false";
  }

  if (vtype === "num") {
    if (str.includes(".")) {
      const n = parseFloat(str);
      return Number.isFinite(n) ? String(n) : "NULL";
    }
    const n = parseInt(str, 10);
    return Number.isFinite(n) ? String(n) : "NULL";
  }

  if (vtype === "int") {
    const n = parseInt(str, 10);
    if (!Number.isFinite(n) || !/^-?\d+$/.test(str)) return "NULL";
    return String(n);
  }

  if (vtype === "date_iso") {
    if (!val) {
      return "NULL";
    }
    try {
      const date = new Date(String(val));
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${val}`);
      }
      return "'" + date.toISOString() + "'";
    } catch (error: any) {
      throw new Error(`Failed to convert date to ISO string: ${val}. Error: ${error.message}`);
    }
  }

  const escaped = str.replace(/'/g, "''");
  return `'${escaped}'`;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  throw new Error("Web Crypto API is not available in this browser");
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  function readField(): string {
    let field = "";
    if (text[i] === '"') {
      i++;
      while (i < len) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          field += text[i++];
        }
      }
    } else {
      while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
        field += text[i++];
      }
    }
    return field;
  }

  while (i < len) {
    if (text[i] === "\n" || text[i] === "\r") {
      if (text[i] === "\r" && text[i + 1] === "\n") i++;
      i++;
      continue;
    }
    const row: string[] = [];
    while (i < len) {
      row.push(readField());
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "\r") i++;
      if (text[i] === "\n") i++;
      break;
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
  }
  return rows;
}

export function rowsToObjects(rawRows: string[][]): Record<string, string>[] {
  if (rawRows.length < 2) return [];
  const headers = rawRows[0].map((h) => h.trim());
  return rawRows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] !== undefined ? cells[idx] : "";
    });
    return obj;
  });
}

export function convertRows(rows: Record<string, string>[]): string {
  const custRows: string[] = [];
  const loanRows: string[] = [];
  const stateRows: string[] = [];
  const collatRows: string[] = [];

  for (const r of rows) {
    const cHistId = uuid();
    const cId = uuid();
    const loanId = r.id || r.loan_id || uuid();

    const rawBranchCode = String(r.branch_code ?? "").trim();
    const branchCode = /^\d+$/.test(rawBranchCode)
      ? String(parseInt(rawBranchCode, 10))
      : r.branch_code || "";

    const rawBranchLeasingId = String(r.branch_leasing_id ?? "").trim();
    const branchLeasingId = /^\d+$/.test(rawBranchLeasingId)
      ? String(parseInt(rawBranchLeasingId, 10))
      : r.branch_leasing_id || "";

    const contractNo = r.contract_number || r.contract_no || "";

    const cVals = [
      sqlVal(cHistId),
      sqlVal(cId),
      sqlVal(r.full_name),
      sqlVal(r.phone_number),
      sqlVal(r.email),
      sqlVal(r.regencies),
      sqlVal(r.nik),
      sqlVal(r.ktp_image_url),
      sqlVal(r.selfie_image_url),
      sqlVal(r.dob),
      sqlVal(r.birthplace),
      sqlVal((r.gender || "").toLowerCase()),
      sqlVal(r.mother_maiden_name),
      sqlVal(r.ktp_province),
      sqlVal(r.ktp_city),
      sqlVal(r.ktp_district),
      sqlVal(r.ktp_village),
      sqlVal(r.ktp_postcode),
      sqlVal(r.ktp_full_address),
      sqlVal(r.marital_status),
      sqlVal(r.occupation),
      sqlVal(r.npwp_number),
      sqlVal(r.current_province),
      sqlVal(r.current_city),
      sqlVal(r.current_district),
      sqlVal(r.current_village),
      sqlVal(r.current_postcode),
      sqlVal(r.current_full_address),
      sqlVal(r.branch),
      sqlVal(branchCode),
      sqlVal(r.final_total_income, "int"),
      sqlVal(r.is_already_sent_to_dleas, "bool"),
      sqlVal(r.created_at, "date_iso"),
      sqlVal(r.updated_at, "date_iso"),
    ];
    custRows.push("\t(" + cVals.join(", ") + ")");

    const lVals = [
      sqlVal(loanId),
      sqlVal(r.reference_id),
      sqlVal(r.status),
      sqlVal(r.tenor, "int"),
      sqlVal(r.partner_id),
      sqlVal(cHistId),
      sqlVal(contractNo),
      sqlVal(r.desired_amount, "int"),
      sqlVal(r.desired_disburse_amount, "int"),
      sqlVal(r.approved_amount, "int"),
      sqlVal(r.installment, "int"),
      sqlVal(r.interest, "num"),
      sqlVal(r.flat_rate, "num"),
      sqlVal(r.effective_rate, "num"),
      sqlVal(branchLeasingId, "int"),
      sqlVal(r.branch_leasing),
      sqlVal(r.order_master_id),
      sqlVal(r.financing_agreement),
      sqlVal(r.product_id),
      sqlVal(r.product_type),
      sqlVal(r.customer_target),
      sqlVal(r.loan_purpose),
      sqlVal(r.financing_type),
      sqlVal(r.customer_type),
      sqlVal(r.collateral_type),
      sqlVal(r.installment_type),
      sqlVal(r.tenor_type),
      sqlVal(r.installment_config),
      sqlVal(r.created_at_loan, "date_iso"),
      sqlVal(r.updated_at_loan, "date_iso"),
    ];
    loanRows.push("\t(" + lVals.join(", ") + ")");

    const remarks = `Seeded from LMS agreement ${contractNo}`;
    const sVals = [
      sqlVal(loanId),
      sqlVal(r.status || "go-live"),
      sqlVal(remarks),
      sqlVal(r.created_at_loan, "date_iso"),
      sqlVal(r.updated_at_loan, "date_iso"),
    ];
    stateRows.push("\t(" + sVals.join(", ") + ")");

    const isTax = ["true", "1"].includes(String(r.is_active_vehicle_tax || "").toLowerCase())
      ? "'1'"
      : "'0'";

    const colVals = [
      sqlVal(loanId),
      sqlVal(r.brand),
      sqlVal(r.model),
      sqlVal(r.variant),
      sqlVal(r.year, "int"),
      sqlVal(r.plat_number),
      sqlVal(r.chassis_number),
      sqlVal(r.engine_number),
      sqlVal(r.bpkb_number),
      sqlVal(r.stnk_number),
      sqlVal(r.status_1),
      sqlVal(r.collateral_name),
      sqlVal(r.collateral_ownership),
      isTax,
      sqlVal(r.color),
      sqlVal(r.price, "int"),
      sqlVal(r.invoice_number),
      sqlVal(r.bpkb_ownership),
      sqlVal(r.bpkb_ownership_nik),
      sqlVal(r.bpkb_ownership_name),
      sqlVal(r.bpkb_ownership_phone),
      sqlVal(r.bpkb_ownership_relation),
      sqlVal(r.vehicle_type),
      sqlVal(r.car_type),
      sqlVal(r.car_category),
      sqlVal(r.sjmb_type),
      sqlVal(r.conditions),
      sqlVal(r.transportation_type),
      sqlVal(r.manufacture_country),
      sqlVal(r.loan_states_created_at, "date_iso"),
      sqlVal(r.loan_states_updated_at, "date_iso"),
    ];
    collatRows.push("\t(" + colVals.join(", ") + ")");
  }

  const sqlOut: string[] = [];

  sqlOut.push(
    "INSERT INTO customers_data_history (\n" +
      "\tid, customers_id, full_name, phone_number, email, regencies, nik,\n" +
      "\tktp_image_url, selfie_image_url, dob, birthplace, gender, mother_maiden_name,\n" +
      "\tktp_province, ktp_city, ktp_district, ktp_village, ktp_postcode, ktp_full_address,\n" +
      "\tmarital_status, occupation, npwp_number,\n" +
      "\tcurrent_province, current_city, current_district, current_village, current_postcode,\n" +
      "\tcurrent_full_address, branch, branch_code, final_total_income,\n" +
      "\tis_already_sent_to_dleas, created_at, updated_at\n" +
      "\t)\n" +
      "VALUES\n" +
      custRows.join(",\n") +
      ";\n"
  );

  sqlOut.push(
    "INSERT INTO loans (\n" +
      "\tid, reference_id, status, tenor, partner_id, customers_data_history_id,\n" +
      "\tcontract_number, desired_amount, desired_disburse_amount, approved_amount,\n" +
      "\tinstallment, interest, flat_rate, effective_rate,\n" +
      "\tbranch_leasing_id, branch_leasing, order_master_id, financing_agreement,\n" +
      "\tproduct_id, product_type, customer_target, loan_purpose, financing_type,\n" +
      "\tcustomer_type, collateral_type, installment_type, tenor_type, installment_config,\n" +
      "\tcreated_at, updated_at\n" +
      "\t)\n" +
      "VALUES\n" +
      loanRows.join(",\n") +
      ";\n"
  );

  sqlOut.push(
    "INSERT INTO loan_states (\n" +
      "\tloans_id, status, remarks, created_at, updated_at\n" +
      "\t)\n" +
      "VALUES\n" +
      stateRows.join(",\n") +
      ";\n"
  );

  sqlOut.push(
    "INSERT INTO collateral (\n" +
      "\tloan_id, brand, model, variant, year, plat_number, chassis_number, engine_number,\n" +
      "\tbpkb_number, stnk_number, status, collateral_name, collateral_ownership,\n" +
      "\tis_active_vehicle_tax, color, price, invoice_number, bpkb_ownership,\n" +
      "\tbpkb_ownership_nik, bpkb_ownership_name, bpkb_ownership_phone, bpkb_ownership_relation,\n" +
      "\tvehicle_type, car_type, car_category, sjmb_type, condition, transportation_type,\n" +
      "\tmanufacture_country, created_at, updated_at\n" +
      "\t)\n" +
      "VALUES\n" +
      collatRows.join(",\n") +
      ";\n"
  );

  return sqlOut.join("\n");
}

export function csvTextToSql(csvText: string): { sql: string; rowCount: number; headers: string[] } {
  const raw = parseCSV(csvText);
  if (raw.length < 2) {
    return { sql: "", rowCount: 0, headers: [] };
  }
  const headers = raw[0].map((h) => h.trim());
  const objects = rowsToObjects(raw);
  const sql = convertRows(objects);
  return { sql, rowCount: objects.length, headers };
}
