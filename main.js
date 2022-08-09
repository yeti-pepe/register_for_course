const FOUND_SEARCH_RESULTS_EVENT = "found_search_results_event";


const observer = new Observer();
const ref = {
    searchResults: [],
    tracingLectures: [],
};



document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});

    // observer.regist(FOUND_SEARCH_RESULTS_EVENT, )
});

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
        result.concat(list);
    }
    return result;
}



const onSearchBtnClick = async () => {
    let year = document.getElementById('year').value;
    let semester = document.getElementById('semester').value;
    let lectureName = document.getElementById('lecture-name').value;
    let result = await search(year, semester, lectureName);
    console.log(result);
}