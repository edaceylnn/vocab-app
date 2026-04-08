import * as api from './db.api';
import * as local from './db.native.local';

const useApi = !!process.env.EXPO_PUBLIC_API_URL;

export const createSet = useApi ? api.createSet : local.createSet;
export const getAllSets = useApi ? api.getAllSets : local.getAllSets;
export const getSetCardCount = useApi ? api.getSetCardCount : local.getSetCardCount;
export const createCard = useApi ? api.createCard : local.createCard;
export const getCardsDueToday = useApi ? api.getCardsDueToday : local.getCardsDueToday;
export const getCardsForStudy = useApi ? api.getCardsForStudy : local.getCardsForStudy;
export const markCardReviewed = useApi ? api.markCardReviewed : local.markCardReviewed;
export const getCardsDueCount = useApi ? api.getCardsDueCount : local.getCardsDueCount;
export const getBoxCounts = useApi ? api.getBoxCounts : local.getBoxCounts;
export const updateCardAfterReview = useApi ? api.updateCardAfterReview : local.updateCardAfterReview;
export const getAllCards = useApi ? api.getAllCards : local.getAllCards;
export const getCardsBySet = useApi ? api.getCardsBySet : local.getCardsBySet;
export const getSetById = useApi ? api.getSetById : local.getSetById;
export const getOrCreateDefaultSet = useApi ? api.getOrCreateDefaultSet : local.getOrCreateDefaultSet;
export const getTodayReviewedCount = useApi ? api.getTodayReviewedCount : local.getTodayReviewedCount;
export const getTotalCardCount = useApi ? api.getTotalCardCount : local.getTotalCardCount;
export const getRecentCards = useApi ? api.getRecentCards : local.getRecentCards;
export const getCardById = useApi ? api.getCardById : local.getCardById;
export const updateCard = useApi ? api.updateCard : local.updateCard;
export const deleteCard = useApi ? api.deleteCard : local.deleteCard;

/** Notes use the API when `EXPO_PUBLIC_API_URL` is set; otherwise SQLite. */
export const createNote = useApi ? api.createNote : local.createNote;
export const listNotes = useApi ? api.listNotes : local.listNotes;
export const getNoteById = useApi ? api.getNoteById : local.getNoteById;
export const updateNote = useApi ? api.updateNote : local.updateNote;
export const deleteNote = useApi ? api.deleteNote : local.deleteNote;
export const setNotePinned = useApi ? api.setNotePinned : local.setNotePinned;
