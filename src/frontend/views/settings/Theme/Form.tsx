import { IFormProps } from "frontend/lib/form/types";
import { SchemaForm } from "frontend/components/SchemaForm";
import { MAKE_APP_CONFIGURATION_CRUD_CONFIG } from "frontend/hooks/configuration/configuration.constant";
import { UPDATE_USER_PREFERENCES_FORM_SCHEMA } from "frontend/views/account/Preferences/constants";
import { ColorSchemes, IThemeSettings } from "shared/types/ui";

type Settings = IThemeSettings & { theme: ColorSchemes };

const CRUD_CONFIG = MAKE_APP_CONFIGURATION_CRUD_CONFIG("theme_color");

export function ThemeSettingsForm({
  onSubmit,
  initialValues,
}: IFormProps<Settings>) {
  return (
    <SchemaForm<Settings>
      onSubmit={onSubmit}
      initialValues={initialValues}
      icon="save"
      buttonText={CRUD_CONFIG.FORM_LANG.UPSERT}
      formExtension={{
        fieldsState: `
        return {
          primaryDark: {
            hidden: $.formValues.theme === "light" || !$.formValues.theme
          },
          primary: {
            hidden: $.formValues.theme === "dark" || !$.formValues.theme
          }
        }`,
      }}
      fields={{
        primary: {
          label: "Light Color Scheme",
          type: "color",
          validations: [
            {
              validationType: "required",
            },
          ],
        },
        primaryDark: {
          label: "Dark Color Scheme",
          type: "color",
          validations: [
            {
              validationType: "required",
            },
          ],
        },
        theme: UPDATE_USER_PREFERENCES_FORM_SCHEMA.theme,
      }}
    />
  );
}
