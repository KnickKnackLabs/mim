import type { ProgramAst } from "../language/program-ast";
import type { ProgramValidationDiagnostic, ProgramValidationResult } from "./diagnostics";
import { DEFAULT_PROGRAM_DEFINITIONS, type ProgramDefinitions } from "./definitions";
import { inputNames } from "./expression-context";
import { requireOneStatement } from "./required-statement";
import { indexStatements } from "./statement-index";
import type { ExpressionPlan } from "./types";
import { validateAxes } from "./validate-axes";
import { requireExpressionType, validateExpression } from "./validate-expression";
import { validateOverlays } from "./validate-overlays";
import { validateParameters } from "./validate-parameters";

export function validateProgram(
  ast: ProgramAst,
  definitions: ProgramDefinitions = DEFAULT_PROGRAM_DEFINITIONS,
): ProgramValidationResult {
  const diagnostics: ProgramValidationDiagnostic[] = [];
  if (ast.version !== 1) {
    diagnostics.push({
      code: "unsupported-version",
      message: `unsupported mim version ${ast.version}`,
      span: ast.statements[0]?.span ?? ast.span,
    });
  }

  const statements = indexStatements(ast);
  const parameterValidation = validateParameters(statements.parameters, diagnostics);
  const axes = validateAxes(statements.axes, definitions, diagnostics);
  const overlays = validateOverlays(statements.overlays, diagnostics);
  const fieldStatement = requireOneStatement("field", statements.fields, ast.span, diagnostics);
  const lensStatement = requireOneStatement("lens", statements.lenses, ast.span, diagnostics);
  const colorStatement = requireOneStatement("color", statements.colors, ast.span, diagnostics);

  const parameters = parameterValidation.names;
  const field = fieldStatement
    ? validateExpression(fieldStatement.expression, {
        definitions,
        diagnostics,
        names: { ...inputNames(["x", "y", "xi", "yi"]), ...parameters },
      })
    : null;
  const lens = lensStatement
    ? validateExpression(lensStatement.expression, {
        definitions,
        diagnostics,
        names: { ...inputNames(["value"]), ...parameters },
      })
    : null;
  const color = colorStatement
    ? validateExpression(colorStatement.expression, {
        definitions,
        diagnostics,
        names: { ...inputNames(["lens", "value"]), ...parameters },
      })
    : null;

  if (fieldStatement) requireExpressionType(field, "number", "field", fieldStatement.expression, {
    definitions, diagnostics, names: {},
  });
  if (lensStatement) requireExpressionType(lens, "number", "lens", lensStatement.expression, {
    definitions, diagnostics, names: {},
  });
  if (colorStatement) requireExpressionType(color, "color", "color", colorStatement.expression, {
    definitions, diagnostics, names: {},
  });

  if (
    diagnostics.length > 0
    || !axes.x
    || !axes.y
    || !field
    || !lens
    || !color
  ) {
    return { diagnostics, ok: false };
  }

  return {
    diagnostics: [],
    ok: true,
    program: {
      axes: { x: axes.x, y: axes.y },
      color: color as ExpressionPlan,
      field: field as ExpressionPlan,
      kind: "validated-program",
      lens: lens as ExpressionPlan,
      overlays,
      parameters: parameterValidation.parameters,
      span: ast.span,
      version: 1,
    },
  };
}
