import { of } from "rxjs";
import { THEME } from "../../mydb/types/me";

export class ThemeServiceSpy {
    userPreference = jasmine.createSpy('userPreference').and.returnValue(THEME.AUTO);
}