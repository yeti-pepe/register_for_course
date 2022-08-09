const SHOW_SEARCH_RESULTS_EVENT = "show_search_results_event";
const ADD_TRACING_LECTURE_EVENT = "add_tracing_lecture_event";
const REMOVE_TRACING_LECTURE_EVENT = '_remove_tracing_lecture_event';
const ALERT_LECTURE_EVENT = "_alert_lecture_event";
const INVALID_LECTURE_EVENT = "_invalid_lecture_event";

const observer = new Observer();
const ref = {
    tracingLectures: {}
};

class Lecture {
    constructor() {
        this.lectureName = "";
        this.hakNum = "";
        this.lectureNum = "";
        this.professor = "";
        this.applicants = 0;
        this.limit = 0;
    }

    parse(raw) {
        this.lectureName = raw.gwamokNm;
        this.hakNum = raw.haksuNo;
        this.lectureNum = raw.suupNo;
        this.professor = raw.gyogangsaNms;
        
        let jehanInwon = raw.jehanInwon;
        let index = jehanInwon.indexOf("/");
        this.applicants = jehanInwon.substr(0, index);
        this.limit = jehanInwon.substr(index+1, jehanInwon.length);
    }
}


// data must be JSON format made by createSearchCondition func
const searchLecture = async(data) => {
    return await fetch(
        'https://portal.hanyang.ac.kr/sugang/SgscAct/findSuupSearchSugangSiganpyo.do',
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json+sua; charset=UTF-8'
            },
        }
    );
}

const createSearchCondition = (year, semester, lectureName) => {
    const dummy = {
        maxRows: "20",
        notAppendQrys: "true",
        skipRows: "0",
        strChgGwamok: "",
        strDaehak: "",
        strDetailGb: "0",
        strHakgwa: "",
        strIlbanCommonGb: "",
        strIsSugangSys: "true",
        strIsuGbCd: "",
        strIsuGrade: "",
        strJojik: "H0002256",
        strLocaleGb: "ko",
        strSuupOprGb: "0",
        strTsGangjwa: "",
        strTsGangjwaAll: "0",
        strYeongyeok: "",
        strHaksuNo: "",
        strSuupTerm: semester,
        strSuupYear: year,
        strGwamok: lectureName,
    }
    return dummy;
}

const search = async (year, semester, lectureName) => {
    let response = await searchLecture(createSearchCondition(year, semester, lectureName));
    let lectures = await response.json();
    let result = [];

    if (lectures) {
        let list = lectures.DS_SUUPGS03TTM01[0].list;

        for (let i = 0; i < list.length; i++) {
            let lecture = new Lecture();
            lecture.parse(list[i]);
            result.push(lecture);
        }
    }
    return result;
}



const onSearchBtnClick = async () => {
    let year = document.getElementById('year').value;
    let semester = document.getElementById('semester').value;
    let lectureName = document.getElementById('lecture-name').value;
    let searchResults = await search(year, semester, lectureName);

    observer.notify(SHOW_SEARCH_RESULTS_EVENT, searchResults, 1);
}

////// VIEW

// clear all rows when index -1
const clearTable = (target, index = -1) => {
    let numRows = target.rows.length;

    if (index > -1) target.deleteRow(index);
    else {
        for (let i = 0; i < numRows; i++)
            target.deleteRow(-1);
    }
}

const pushOnTable = (target, lecture, onclick) => {
    let newRow = target.insertRow();
    
    let lecNameCell = newRow.insertCell(0);
    // give ... option on too much long name
    lecNameCell.classList.add("lecture-name-col");
    lecNameCell.innerHTML = `<span title="${lecture.lectureName}">${lecture.lectureName}</span>`

    let hakNumCell = newRow.insertCell(1);
    hakNumCell.innerText = lecture.hakNum;
    let lecNumCell = newRow.insertCell(2);
    lecNumCell.innerText = lecture.lectureNum;
    let professorNameCell = newRow.insertCell(3);
    professorNameCell.innerText = lecture.professor;
    let applicantsCell = newRow.insertCell(4);
    applicantsCell.innerText = lecture.applicants;
    let limitCell = newRow.insertCell(5);
    limitCell.innerText = lecture.limit;

    if (onclick) newRow.onclick = onclick;

    return newRow;
}

const removeFromTable = (target, lecture) => {
    let rows = target.rows;

    for (let i = 0; i < rows.length; i++) {
        let lecNumCell = rows[i].cells[2];
        if (lecNumCell.innerText === lecture.lectureNum) {
            target.deleteRow(i);
            return;
        }
    }
}


////// OBSERVER EVENT HANDLER 

const showSearchResult = (searchResults) => {
    let table = document.getElementById('search-result-table');
    clearTable(table);

    for (let i = 0; i < searchResults.length; i++) {
        let lecture = searchResults[i];

        let onclick = () => {
            observer.notify(ADD_TRACING_LECTURE_EVENT, lecture);
        }
        
        pushOnTable(table, lecture, onclick);
    }
}

const addTracingLecture = (lecture) => {
    if (ref.tracingLectures[lecture.lectureNum]) {
        // alert this lecture is already enrolled
        return;
    }

    ref.tracingLectures[lecture.lectureNum] = lecture;
    let table = document.getElementById('tracing-lecture-table');

    let onclick = () => {
        delete ref.tracingLectures[lecture.lectureNum];
        observer.notify(lecture.lectureNum + REMOVE_TRACING_LECTURE_EVENT);
    }

    let row = pushOnTable(table, lecture, onclick);
    
    let alertLecEventId = observer.regist(lecture.lectureNum + ALERT_LECTURE_EVENT, () => {
        row.classList.add('alert');
    });
    let invalidLecEventId = observer.regist(lecture.lectureNum + INVALID_LECTURE_EVENT, () => {
        row.classList.remove('alert');
    });
    
    observer.once(lecture.lectureNum + REMOVE_TRACING_LECTURE_EVENT, () => {
        observer.unregistById(alertLecEventId);
        observer.unregistById(invalidLecEventId);
        removeFromTable(table, lecture);
    })
}



document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});

    observer.regist(SHOW_SEARCH_RESULTS_EVENT, showSearchResult);
    observer.regist(ADD_TRACING_LECTURE_EVENT, addTracingLecture);
});