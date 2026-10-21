// ============================================================
//  API.JS — shell only. Lesson files never import this.
// ============================================================

import GAS_URL from '../../config/gas.config.js';

export async function loginStudent(rollNo, password) {
  try {
    const url = `${GAS_URL}?action=login&rollNo=${encodeURIComponent(rollNo)}&password=${encodeURIComponent(password)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('login failed:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export async function registerStudent(email, password, name) {
  try {
    const url = `${GAS_URL}?action=register&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&name=${encodeURIComponent(name)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('register failed:', err);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export async function saveProgress(rollNo, courseId, unitId) {
  try {
    const url = `${GAS_URL}?action=saveProgress&rollNo=${encodeURIComponent(rollNo)}&courseId=${encodeURIComponent(courseId)}&unitId=${encodeURIComponent(unitId)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('saveProgress failed:', err);
    return { success: false };
  }
}

export async function getProgress(rollNo, courseId) {
  try {
    const url = `${GAS_URL}?action=getProgress&rollNo=${encodeURIComponent(rollNo)}&courseId=${encodeURIComponent(courseId)}`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.completedUnits || [];
  } catch (err) {
    console.error('getProgress failed:', err);
    return [];
  }
}
