import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function MatchValidator(a: string, b: string, error = 'notMatching'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const aValue = control.get(a)?.value;
        const bValue = control.get(b)?.value;

        if (aValue !== bValue) {
            const err: {[key: string]: boolean} = {};
            err[error] = true;
            return err;
        }

        return null;
    }
}

export function NoMatchValidator(a: string, b: string, error = 'matching'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const aValue = control.get(a)?.value;
        const bValue = control.get(b)?.value;

        if (aValue === bValue && (aValue !== '' || bValue !== '')) {
            const err: {[key: string]: boolean} = {};
            err[error] = true;
            return err;
        }

        return null;
    }
}