/**
 * Created by zcy on 12/19/2016.
 */

const range = (n) => Array.from((new Array(n)).keys());

const spring = range(13).map(x=>range(7).map(x=>null));
const summer = range(13).map(x=>range(7).map(x=>null));
let screen = spring;


let courses = [];

const syncCourses = ()=>{
    spring.forEach( (x,i) =>x.map((y,j)=> spring[i][j] = y == "close" ? "close" : null ));
    summer.forEach( (x,i) =>x.map((y,j)=> summer[i][j] = y == "close" ? "close" : null ));
    courses.forEach( (course,i) => {
        course.__tmp__id = i;
        course.timef.forEach(time => {
            const arr = course.semester == "春夏" ? [spring, summer]
                : course.semester == "春" ? [spring] : [summer];
            arr.forEach(view =>
                time.time.forEach(x => {
                        view[parseInt(x) - 1][parseInt(time.day) - 1] = course;
                    }
                )
            )
        })
    });
    document.getElementById('right').innerHTML =`
     已选上的课程 总学分: ${courses.reduce((prev,x)=>prev+parseInt(x.credit),0)}
      <ul>
         ${courses.map( course => `<li> ${course.name}  ${course.teacher} ${course.score}/${course.gpa}<br> ${course.time} </li>`).join("")}
      </ul>
    `;
    syncResult();
};


const syncResult = () => {
    const table = document.getElementById('course-view');
    table.innerHTML = screen.map( (row, i) =>
        `<tr>${row.map( (elem,j) => 
            !elem ? `<td class="non-selected" r="${i}" c="${j}"><br/></td>` :
                elem == "close" ? `<td class="close" r="${i}" c="${j}"><br/></td>`:
                    `<td class="selected" myid="${elem.__tmp__id}" r="${i}" c="${j}">
            ${elem.name} ${elem.teacher} ${elem.score}/${elem.gpa} </td>`
        ).join("")}</tr>`
    ).join("");
    Array
        .from(document.querySelectorAll("td"))
        .forEach(dom=>dom.addEventListener("click", onClickCourse, false));
};

const onClickCourse = (event) => {
    const r = parseInt(event.target.attributes['r'].value);
    const c = parseInt(event.target.attributes['c'].value);
    if(screen[r][c] == "close") screen[r][c] = null;
    else if(!screen[r][c])screen[r][c] = "close";
    else{
        const id = screen[r][c].__tmp__id;
        courses[id] = courses[courses.length - 1];
        courses.pop();
        screen[r][c] = null;
    }
    syncCourses();
    onSearch();
};



const dayCN = ['一', '二', '三', '四', '五', '六', '日'];
const semesterCN = ['春','夏','秋','冬', ' '];

function getSpecialTime(raw) {
    if (raw.indexOf('-') == -1) {
        return [parseInt(raw.split('{')[1].split('第')[1].split('周')[0])];
    }
    else {
        const timeArray = raw.split('{')[1].split('第')[1].split('周')[0].split('-').map(x=>parseInt(x));
        return Array.from(new Array(timeArray[1] - timeArray[0]).keys()).map(x=>x + timeArray[0]); // = range(timeArray[0], timeArray[1])
    }
}

function parseTime(data){
    data = Array.from(data).filter(x=>semesterCN.indexOf(x)==-1).join("");
    if (!data || data == "")return [];
    return data.split(';').reduce((prev, raw) => {
        if (!raw || raw[0] != '周')return prev;
        const infoArray = raw.split('{');
        const timeArray = infoArray[0].split('第')[1].split('节')[0].split(',').map(x=>parseInt(x));
        const day = dayCN.indexOf(infoArray[0][1]) + 1;
        const type = !infoArray[1] ? 'both' : infoArray[1][0] == '单' ? 'odd' : infoArray[1][0] == '双' ? 'even' : 'discrete';
        const interval = type == 'discrete' ? getSpecialTime(infoArray[1]) : [];
        return prev.concat([{
            day: day,
            time: timeArray,
            ignoreAdjustment: false,
            week: {
                type: type,
                weeks: interval
            }
        }]);
    }, []);
}

let newData = data;

function onFilter(){
    const filterFunction = eval(`
        (function(x) {
            return ${document.getElementById('filter').innerHTML}
        })
    `);
    newData = data.filter(filterFunction);
    newData.forEach(x=>{
        try {
            x.timef = parseTime(x.time)
        }catch(e){
            x.timef = [];
        }
    });
}

function switchSemester(that){
    if( that.innerHTML == "春"){
        that.innerHTML = "夏";
        screen = summer;
    }
    else{
        that.innerHTML = "春";
        screen = spring;
    }
    syncResult();
}

let filteredResult = [];

const checkConfilct = ( course )=>{
    return course.timef && course.timef.every( time =>{
        const arr = course.semester == "春夏" ? [spring, summer]
            : course.semester == "春" ? [spring] : [summer];
        return arr.every( view =>
            time.time.every( x =>{
                return x && !view[parseInt(x) - 1][parseInt(time.day) - 1];
            })
        )
    });
};

function onSearch(){
    filteredResult = newData.filter( x=> x.name.indexOf(
        document.getElementById('course-name').value
    ) != -1 || x.cid.indexOf(
        document.getElementById('course-name').value
        ) != -1
    ).filter(x => checkConfilct(x));
    filteredResult.sort( (x,y) => parseFloat(y.score) - parseFloat(x.score) );
    //console.log(filteredResult);
    document.getElementById('manual-result').innerHTML =
        filteredResult
            .map( (x,i) => `
<li class="filtered" myid="${i}">${x.name} ${x.teacher} ${x.score}/${x.gpa} <br> ${x.time}</li>`).join("");
    Array.from(document.querySelectorAll(".filtered"))
        .forEach( elem => elem.addEventListener('click',(event)=> {
            //console.log(event.target.attributes);
            courses.push(filteredResult[event.target.attributes["myid"].value]);
            syncCourses();
            onSearch();
            },false)
        );
}

document
    .getElementById('course-name')
    .addEventListener('input',onSearch,false);

syncCourses();
onFilter();


function save(){
    window.localStorage.setItem('course',JSON.stringify(courses));
}

function load(){
    courses = JSON.parse(window.localStorage.getItem('course'));
    syncCourses();
    onSearch();
}